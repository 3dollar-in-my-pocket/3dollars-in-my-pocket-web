'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { ENTRY_COST, type Prize } from '@/src/config/PointEvent';
import { formatPoint } from '@/src/utils/pointEvent';
import styles from '../point.module.css';

type Props = {
  prize: Prize;
  balance: number;
  entryCount: number;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/** B-1. 응모 확인 바텀시트 */
export default function EntrySheet({
  prize,
  balance,
  entryCount,
  submitting,
  onCancel,
  onConfirm,
}: Props) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel, submitting]);

  return (
    <>
      <div className={styles.dim} onClick={submitting ? undefined : onCancel} aria-hidden />
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-sheet-title"
      >
        <span className={styles.sheetHandle} aria-hidden />
        <div className={styles.sheetProduct}>
          <div className={styles.sheetImage}>
            <Image src={prize.image} alt="" fill sizes="104px" />
          </div>
          <h2 id="entry-sheet-title" className={styles.sheetTitle}>
            {prize.name}에 응모할까요?
          </h2>
          <p className={styles.sheetSub}>
            {prize.winnerCount}명을 추첨해요. 응모할수록 확률이 올라가요.
          </p>
        </div>

        <div className={styles.calcBox}>
          <div className={styles.calcRow}>
            <span>사용할 포인트</span>
            <strong>{formatPoint(ENTRY_COST)}</strong>
          </div>
          <div className={styles.calcRow}>
            <span>응모 후 남는 포인트</span>
            <strong>{formatPoint(balance - ENTRY_COST)}</strong>
          </div>
          <div className={styles.calcDivider} />
          <div className={styles.calcRow}>
            <span>내 응모 횟수</span>
            <span className={styles.countChange}>
              {entryCount}회
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/events/point/icons/arrow-right.svg" width={16} height={16} alt="에서" />
              <strong>{entryCount + 1}회</strong>
            </span>
          </div>
        </div>

        <p className={styles.sheetNotice}>응모에 쓴 포인트는 돌려받을 수 없어요</p>

        <div className={styles.sheetButtons}>
          <button
            type="button"
            className={`${styles.cta} ${styles.ctaSecondary}`}
            onClick={onCancel}
            disabled={submitting}
          >
            취소
          </button>
          <button type="button" className={styles.cta} onClick={onConfirm} disabled={submitting}>
            {submitting ? '응모하는 중…' : '응모하기'}
          </button>
        </div>
      </section>
    </>
  );
}
