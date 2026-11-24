'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { POINT_EVENT_PATH } from '@/src/config/PointEvent';
import type { PointHistory, PointHistoryPage, Raffle } from '@/src/models/PointEvent';
import {
  createRequestKey,
  formatDayHeader,
  formatDday,
  formatPoint,
  formatShortDate,
  formatTime,
  groupByDay,
  historyTitle,
  myEntryCount,
  raffleCost,
  type HistoryFilter,
} from '@/src/utils/pointEvent';
import styles from '../point.module.css';
import EntrySheet from './EntrySheet';

type Props = {
  initialBalance: number;
  initialHistories: PointHistoryPage;
  /** null 이면 응모 목록을 불러오지 못한 상태 */
  initialRaffles: Raffle[] | null;
  /** 오늘(KST) 포인트 순증감. null 이면 불러오지 못한 상태 */
  initialTodayEarned: number | null;
  endAt: string | null;
  announceAt: string | null;
};

type ApiBody<T> =
  | { status: 'ok'; data: T }
  | { status: 'unauthorized' }
  | { status: 'error'; message?: string };

type EntryBody =
  | { status: 'ok' }
  | { status: 'unauthorized' }
  | { status: 'error'; retryable: boolean; code?: string; message?: string };

type StatusData = { balance: number; todayEarned: number | null; raffles: Raffle[] | null };

const FILTERS: { value: HistoryFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'EARN', label: '적립' },
  { value: 'SPEND', label: '사용 · 회수' },
];

const EXPIRED_MESSAGE = '로그인이 만료됐어요. 앱에서 이 페이지를 다시 열어 주세요.';
const NETWORK_MESSAGE = '인터넷 연결을 확인하고 다시 시도해 주세요.';
/** 연결 실패·5xx 일 때 같은 requestKey 로 다시 보내는 횟수 (첫 요청 포함) */
const ENTRY_ATTEMPTS = 3;

async function requestJson<T>(input: string, init?: RequestInit): Promise<ApiBody<T>> {
  try {
    const response = await fetch(input, { credentials: 'same-origin', ...init });
    return (await response.json()) as ApiBody<T>;
  } catch {
    return { status: 'error', message: NETWORK_MESSAGE };
  }
}

/**
 * 응모 1회. 탭 1번에 requestKey 1개를 만들고,
 * 응답을 못 받았거나 5xx 면 같은 키로 다시 보낸다 (서버가 이미 처리했다면 409 → 성공).
 */
async function postEntry(raffleId: string): Promise<EntryBody> {
  const requestKey = createRequestKey();
  let last: EntryBody = { status: 'error', retryable: true };
  for (let attempt = 0; attempt < ENTRY_ATTEMPTS; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    try {
      const response = await fetch('/api/events/point/entries', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raffleId, requestKey }),
      });
      last = (await response.json()) as EntryBody;
    } catch {
      last = { status: 'error', retryable: true };
    }
    if (last.status !== 'error' || !last.retryable) return last;
  }
  return last;
}

export default function PointDashboard({
  initialBalance,
  initialHistories,
  initialRaffles,
  initialTodayEarned,
  endAt,
  announceAt,
}: Props) {
  const [balance, setBalance] = useState(initialBalance);
  const [todayEarned, setTodayEarned] = useState(initialTodayEarned);
  const [raffles, setRaffles] = useState(initialRaffles);
  const [histories, setHistories] = useState<PointHistory[]>(initialHistories.contents);
  const [cursor, setCursor] = useState(initialHistories.cursor);
  const [filter, setFilter] = useState<HistoryFilter>('ALL');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasAnyHistory, setHasAnyHistory] = useState(initialHistories.contents.length > 0);
  const [sheetRaffleId, setSheetRaffleId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 필터를 빠르게 바꿀 때 늦게 도착한 이전 응답을 버리기 위한 요청 번호 */
  const historyRequest = useRef(0);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = useCallback((message: string, success: boolean) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, success });
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const groups = useMemo(() => groupByDay(histories), [histories]);
  const isEmpty = balance === 0 && !hasAnyHistory;
  const sheetRaffle = raffles?.find((raffle) => raffle.raffleId === sheetRaffleId) ?? null;

  /** 필터 탭의 첫 페이지부터 다시 불러온다 (커서는 필터마다 따로라 이어 쓰면 항목이 빠진다) */
  const loadHistories = async (nextFilter: HistoryFilter) => {
    const requestId = ++historyRequest.current;
    setHistoryLoading(true);
    const body = await requestJson<PointHistoryPage>(`/api/events/point/histories?filter=${nextFilter}`);
    if (requestId !== historyRequest.current) return;
    setHistoryLoading(false);
    if (body.status === 'ok') {
      setHistories(body.data.contents);
      setCursor(body.data.cursor);
      if (nextFilter === 'ALL') setHasAnyHistory(body.data.contents.length > 0);
    } else {
      showToast(body.status === 'unauthorized' ? EXPIRED_MESSAGE : '내역을 불러오지 못했어요.', false);
    }
  };

  const changeFilter = (nextFilter: HistoryFilter) => {
    if (nextFilter === filter) return;
    setFilter(nextFilter);
    setHistories([]);
    setCursor({ nextCursor: null, hasMore: false });
    void loadHistories(nextFilter);
  };

  const loadMore = async () => {
    if (!cursor.nextCursor || loadingMore) return;
    const requestId = historyRequest.current;
    setLoadingMore(true);
    const body = await requestJson<PointHistoryPage>(
      `/api/events/point/histories?filter=${filter}&cursor=${encodeURIComponent(cursor.nextCursor)}`
    );
    setLoadingMore(false);
    if (requestId !== historyRequest.current) return;
    if (body.status === 'ok') {
      setHistories((prev) => prev.concat(body.data.contents));
      setCursor(body.data.cursor);
    } else {
      showToast(body.status === 'unauthorized' ? EXPIRED_MESSAGE : '내역을 불러오지 못했어요.', false);
    }
  };

  /** 잔액 · 오늘 적립 · 응모 목록 다시 조회. 갱신된 응모 목록을 돌려준다 */
  const refreshStatus = async (): Promise<Raffle[] | null> => {
    const body = await requestJson<StatusData>('/api/events/point/status');
    if (body.status !== 'ok') return null;
    setBalance(body.data.balance);
    if (body.data.todayEarned !== null) setTodayEarned(body.data.todayEarned);
    if (body.data.raffles) setRaffles(body.data.raffles);
    return body.data.raffles;
  };

  const enter = async (raffle: Raffle) => {
    if (submitting) return;
    setSubmitting(true);
    const result = await postEntry(raffle.raffleId);

    if (result.status === 'unauthorized') {
      setSubmitting(false);
      showToast(EXPIRED_MESSAGE, false);
      return;
    }

    // 성공이든 실패든 서버 값으로 화면을 맞춘다 (목록은 최대 3분 캐시라 실패 원인이 화면과 다를 수 있다)
    const [latest] = await Promise.all([refreshStatus(), loadHistories(filter)]);
    setSubmitting(false);

    if (result.status === 'ok') {
      setSheetRaffleId(null);
      const count =
        latest?.find((item) => item.raffleId === raffle.raffleId)?.entry.myEntryCount ??
        myEntryCount(raffle) + 1;
      showToast(`${raffle.title} 응모 ${count}회째예요`, true);
      return;
    }

    setSheetRaffleId(null);
    showToast(
      result.message ?? (result.retryable ? NETWORK_MESSAGE : '응모하지 못했어요. 잠시 후 다시 시도해 주세요.'),
      false
    );
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
                {todayEarned !== null && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>오늘 적립</span>
                    <span className={styles.summaryValue}>{formatPoint(todayEarned, { signed: true })}</span>
                  </div>
                )}
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
              여러 번 응모할수록 당첨 확률이 올라가요
            </p>
          </div>
          {raffles === null ? (
            <p className={styles.historyEmpty}>응모할 굿즈를 불러오지 못했어요.</p>
          ) : raffles.length === 0 ? (
            <p className={styles.historyEmpty}>지금 응모할 수 있는 굿즈가 없어요.</p>
          ) : (
            raffles.map((raffle) => {
              const count = myEntryCount(raffle);
              const cost = raffleCost(raffle);
              const affordable = cost === null || balance >= cost;
              const enterable = raffle.entry.enterable;
              return (
                <article key={raffle.raffleId} className={styles.prizeRow}>
                  <div className={styles.thumb}>
                    {raffle.image && (
                      <Image src={raffle.image.imageUrl} alt="" fill sizes="72px" unoptimized />
                    )}
                  </div>
                  <div className={styles.prizeRowText}>
                    <h3 className={styles.prizeRowName}>{raffle.title}</h3>
                    {(raffle.winnerCount !== null || cost !== null) && (
                      <p className={styles.prizeRowWinners}>
                        {[
                          raffle.winnerCount !== null && `추첨 ${raffle.winnerCount}명`,
                          cost !== null && `응모 1회 ${formatPoint(cost)}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                    <span className={count > 0 ? styles.pill : `${styles.pill} ${styles.pillGray}`}>
                      내 응모 {count}회
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.rowButton}
                    disabled={!enterable || !affordable}
                    onClick={() => setSheetRaffleId(raffle.raffleId)}
                  >
                    {!enterable ? '응모 불가' : affordable ? '응모하기' : '포인트 부족'}
                  </button>
                </article>
              );
            })
          )}
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
                onClick={() => changeFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className={styles.historyList} aria-busy={historyLoading}>
            {groups.length === 0 ? (
              <p className={styles.historyEmpty}>
                {historyLoading
                  ? '내역을 불러오는 중…'
                  : filter === 'ALL'
                    ? '아직 포인트 내역이 없어요.'
                    : '해당하는 내역이 없어요.'}
              </p>
            ) : (
              groups.map((group) => <HistoryGroup key={group.day} day={group.day} rows={group.rows} />)
            )}
            {cursor.hasMore && cursor.nextCursor && (
              <button type="button" className={styles.moreButton} onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? '불러오는 중…' : '내역 더 보기'}
              </button>
            )}
          </div>
        </section>
      </div>

      {sheetRaffle && (
        <EntrySheet
          raffle={sheetRaffle}
          balance={balance}
          submitting={submitting}
          onCancel={() => setSheetRaffleId(null)}
          onConfirm={() => enter(sheetRaffle)}
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

function HistoryGroup({ day, rows }: { day: string; rows: PointHistory[] }) {
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
            </div>
          </div>
        );
      })}
    </>
  );
}
