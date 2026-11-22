'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ENTRY_COST,
  POINT_EVENT_PATH,
  PRIZES,
  type Prize,
} from '@/src/config/PointEvent';
import type { PointHistoryPage, PrizeEntryCount } from '@/src/models/PointEvent';
import {
  formatDayHeader,
  formatDday,
  formatPoint,
  formatShortDate,
  formatTime,
  groupByDay,
  historyTitle,
  matchesFilter,
  todayEarned,
  withRunningBalance,
  type HistoryFilter,
  type HistoryRowModel,
} from '@/src/utils/pointEvent';
import styles from '../point.module.css';
import EntrySheet from './EntrySheet';

type Props = {
  initialBalance: number;
  initialHistories: PointHistoryPage;
  initialEntries: PrizeEntryCount[];
  endAt: string | null;
  announceAt: string | null;
};

type ApiBody<T> = { status: 'ok'; data: T } | { status: 'unauthorized' } | { status: 'error'; message?: string };

const FILTERS: { value: HistoryFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'EARN', label: '적립' },
  { value: 'SPEND', label: '사용 · 회수' },
];

const EXPIRED_MESSAGE = '로그인이 만료됐어요. 앱에서 이 페이지를 다시 열어 주세요.';

async function requestJson<T>(input: string, init?: RequestInit): Promise<ApiBody<T>> {
  try {
    const response = await fetch(input, { credentials: 'same-origin', ...init });
    return (await response.json()) as ApiBody<T>;
  } catch {
    return { status: 'error', message: '인터넷 연결을 확인하고 다시 시도해 주세요.' };
  }
}

export default function PointDashboard({
  initialBalance,
  initialHistories,
  initialEntries,
  endAt,
  announceAt,
}: Props) {
  const [balance, setBalance] = useState(initialBalance);
  const [histories, setHistories] = useState(initialHistories.contents);
  const [cursor, setCursor] = useState(initialHistories.cursor);
  const [entries, setEntries] = useState(initialEntries);
  const [filter, setFilter] = useState<HistoryFilter>('ALL');
  const [loadingMore, setLoadingMore] = useState(false);
  const [sheetPrize, setSheetPrize] = useState<Prize | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = useCallback((message: string, success: boolean) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, success });
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const entryCount = (code: string) =>
    entries.find((entry) => entry.prizeCode === code)?.count ?? 0;

  const rows = useMemo(() => withRunningBalance(histories, balance), [histories, balance]);
  const visibleGroups = useMemo(
    () => groupByDay(rows.filter((row) => matchesFilter(row, filter))),
    [rows, filter]
  );
  const isEmpty = balance === 0 && histories.length === 0;

  const loadMore = async () => {
    if (!cursor.nextCursor || loadingMore) return;
    setLoadingMore(true);
    const body = await requestJson<PointHistoryPage>(
      `/api/events/point/histories?cursor=${encodeURIComponent(cursor.nextCursor)}`
    );
    setLoadingMore(false);
    if (body.status === 'ok') {
      setHistories((prev) => prev.concat(body.data.contents));
      setCursor(body.data.cursor);
    } else {
      showToast(body.status === 'unauthorized' ? EXPIRED_MESSAGE : '내역을 불러오지 못했어요.', false);
    }
  };

  const refreshHistories = async () => {
    const body = await requestJson<PointHistoryPage>('/api/events/point/histories');
    if (body.status === 'ok') {
      setHistories(body.data.contents);
      setCursor(body.data.cursor);
    }
  };

  const enter = async (prize: Prize) => {
    if (submitting) return;
    setSubmitting(true);
    const body = await requestJson<{ prizeCode: string; count: number; balance: number }>(
      '/api/events/point/entries',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizeCode: prize.code }),
      }
    );
    setSubmitting(false);

    if (body.status !== 'ok') {
      showToast(
        body.status === 'unauthorized'
          ? EXPIRED_MESSAGE
          : body.message ?? '응모하지 못했어요. 잠시 후 다시 시도해 주세요.',
        false
      );
      return;
    }

    setBalance(body.data.balance);
    setEntries((prev) => [
      ...prev.filter((entry) => entry.prizeCode !== prize.code),
      { prizeCode: prize.code, count: body.data.count },
    ]);
    setSheetPrize(null);
    showToast(`${prize.shortName} 응모 ${body.data.count}회째예요`, true);
    void refreshHistories();
  };

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>포인트 이벤트</h1>
          <Link className={styles.headerLink} href={POINT_EVENT_PATH}>
            이벤트 안내
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/events/point/icons/chevron-right.svg" width={16} height={16} alt="" />
          </Link>
        </header>

        <div className={styles.pointCardWrap}>
          {isEmpty ? (
            <section className={`${styles.pointCard} ${styles.pointCardCompact}`}>
              <BalanceText balance={balance} />
            </section>
          ) : (
            <section className={styles.pointCard}>
              <Image
                src="/events/point/mascot.png"
                alt=""
                width={128}
                height={128}
                className={styles.pointMascot}
                priority
              />
              <BalanceText balance={balance} />
              <div className={styles.summary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>오늘 적립</span>
                  <span className={styles.summaryValue}>
                    {formatPoint(todayEarned(histories), { signed: true })}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>응모 마감까지</span>
                  <span className={styles.summaryValue}>{formatDday(endAt)}</span>
                </div>
              </div>
            </section>
          )}
        </div>

        <p className={styles.announceBar}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/events/point/icons/bell.svg" width={18} height={18} alt="" />
          <span>
            당첨 발표는 <strong>{announceAt ? formatShortDate(announceAt) : '이벤트 종료 후'}</strong>에 앱
            푸시로 알려드려요
          </span>
        </p>

        <section className={styles.prizeSection}>
          <div className={styles.blockTitle}>
            <h2 className={styles.blockHeading}>굿즈 응모</h2>
            <p className={styles.blockSub}>
              응모 1회 {ENTRY_COST}P · 여러 번 응모할수록 당첨 확률이 올라가요
            </p>
          </div>
          {PRIZES.map((prize) => {
            const count = entryCount(prize.code);
            const affordable = balance >= ENTRY_COST;
            return (
              <article key={prize.code} className={styles.prizeRow}>
                <div className={styles.thumb}>
                  <Image src={prize.image} alt="" fill sizes="72px" />
                </div>
                <div className={styles.prizeRowText}>
                  <h3 className={styles.prizeRowName}>{prize.name}</h3>
                  <p className={styles.prizeRowWinners}>추첨 {prize.winnerCount}명</p>
                  <span className={count > 0 ? styles.pill : `${styles.pill} ${styles.pillGray}`}>
                    내 응모 {count}회
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.rowButton}
                  disabled={!affordable}
                  onClick={() => setSheetPrize(prize)}
                >
                  {affordable ? '응모하기' : '포인트 부족'}
                </button>
              </article>
            );
          })}
        </section>

        <div className={styles.divider} />

        <section className={styles.historySection}>
          <h2 className={styles.blockHeading}>포인트 내역</h2>
          <div className={styles.chips} role="group" aria-label="내역 필터">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={item.value === filter ? `${styles.chip} ${styles.chipSelected}` : styles.chip}
                aria-pressed={item.value === filter}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className={styles.historyList}>
            {visibleGroups.length === 0 ? (
              <p className={styles.historyEmpty}>
                {histories.length === 0 ? '아직 포인트 내역이 없어요.' : '해당하는 내역이 없어요.'}
              </p>
            ) : (
              visibleGroups.map((group) => (
                <HistoryGroup key={group.day} day={group.day} rows={group.rows} />
              ))
            )}
            {cursor.hasMore && cursor.nextCursor && (
              <button type="button" className={styles.moreButton} onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? '불러오는 중…' : '내역 더 보기'}
              </button>
            )}
          </div>
        </section>
      </div>

      {sheetPrize && (
        <EntrySheet
          prize={sheetPrize}
          balance={balance}
          entryCount={entryCount(sheetPrize.code)}
          submitting={submitting}
          onCancel={() => setSheetPrize(null)}
          onConfirm={() => enter(sheetPrize)}
        />
      )}

      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast.success && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/events/point/icons/check-circle.svg" width={20} height={20} alt="" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </main>
  );
}

function BalanceText({ balance }: { balance: number }) {
  return (
    <div className={styles.balance}>
      <p className={styles.balanceLabel}>내 포인트</p>
      <p className={styles.balanceValue}>
        {balance.toLocaleString('ko-KR')}
        <span className={styles.balanceUnit}>P</span>
      </p>
    </div>
  );
}

function HistoryGroup({ day, rows }: { day: string; rows: HistoryRowModel[] }) {
  return (
    <>
      <h3 className={styles.dayHeader}>{formatDayHeader(day)}</h3>
      {rows.map((row) => {
        const revoked = row.type === 'REVOKE';
        const amountClass =
          row.type === 'EARN'
            ? `${styles.amount} ${styles.amountEarn}`
            : revoked
              ? `${styles.amount} ${styles.amountRevoke}`
              : styles.amount;
        return (
          <div key={row.pointHistoryId} className={styles.historyRow}>
            <div className={styles.historyText}>
              <div className={styles.historyTitleRow}>
                <p className={styles.historyTitle}>{revoked ? '포인트 회수' : historyTitle(row)}</p>
                {revoked && <span className={styles.revokeTag}>회수</span>}
              </div>
              <p className={styles.historyMeta}>
                {formatTime(row.createdAt)}
                {revoked && row.description ? ` · ${row.description}` : ''}
              </p>
            </div>
            <div className={styles.historyAmount}>
              <span className={amountClass}>{formatPoint(row.amount, { signed: true })}</span>
              <span className={styles.historyBalance}>잔액 {formatPoint(row.balanceAfter)}</span>
            </div>
          </div>
        );
      })}
    </>
  );
}
