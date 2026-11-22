import Skeleton from '../_components/Skeleton';
import styles from '../point.module.css';

/** 내 포인트 로딩 화면 — 고정 정보(제목)는 그대로 보여주고 서버 데이터 자리만 비워 둔다. */
export default function MyPointLoading() {
  return (
    <main className={styles.page} aria-busy="true">
      <p className="sr-only" role="status">
        내 포인트를 불러오는 중이에요
      </p>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>포인트 이벤트</h1>
          {/* 실제 화면의 「이벤트 안내」 링크 높이(44px)만큼 자리를 잡아 둔다 */}
          <span style={{ display: 'flex', alignItems: 'center', height: 44 }}>
            <Skeleton width={72} height={20} />
          </span>
        </header>

        <div className={styles.pointCardWrap}>
          <div className={styles.skeletonPointCard}>
            <Skeleton width={72} height={16} tone="onColor" />
            <Skeleton width={150} height={36} tone="onColor" />
            <Skeleton height={56} radius={14} tone="onColor" />
          </div>
        </div>

        <section className={styles.prizeSection}>
          <div className={styles.blockTitle}>
            <h2 className={styles.blockHeading}>굿즈 응모</h2>
          </div>
          {/* 응모 굿즈는 서버 응모 목록에서 오므로 이름·인원도 비워 둔다 */}
          {[0, 1].map((index) => (
            <article key={index} className={styles.prizeRow}>
              <Skeleton width={72} height={72} radius={14} />
              <div className={styles.prizeRowText}>
                <Skeleton width={120} height={18} />
                <Skeleton width={64} height={16} />
              </div>
              <Skeleton width={72} height={36} radius={12} className={styles.skeletonButton} />
            </article>
          ))}
        </section>

        <section className={styles.historySection}>
          <h2 className={styles.blockHeading}>포인트 내역</h2>
          <div className={styles.skeletonStack}>
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} height={52} radius={12} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
