import Skeleton from './_components/Skeleton';
import styles from './point.module.css';

/** 이벤트 소개 로딩 화면 — 서버 응답 전에 바로 보여준다. */
export default function PointEventLoading() {
  return (
    <main className={styles.page} aria-busy="true">
      <p className="sr-only" role="status">
        이벤트 정보를 불러오는 중이에요
      </p>
      <div className={styles.content}>
        <section className={styles.hero}>
          <div className={styles.badgeRow}>
            <Skeleton width={140} height={28} radius={999} tone="onPink" />
            <Skeleton width={48} height={28} radius={999} tone="onPink" />
          </div>
          <div className={styles.skeletonStack}>
            <Skeleton width="70%" height={34} tone="onPink" />
            <Skeleton width="55%" height={34} tone="onPink" />
            <Skeleton width="85%" height={18} tone="onPink" />
          </div>
          <Skeleton width={180} height={200} radius={24} className={styles.skeletonHeroImage} tone="onPink" />
          <Skeleton height={84} radius={16} tone="onColor" />
        </section>

        <section className={styles.section}>
          <div className={styles.skeletonStack}>
            <Skeleton width={48} height={16} />
            <Skeleton width="50%" height={26} />
          </div>
          <div className={styles.prizeGrid}>
            <Skeleton height={240} radius={20} />
            <Skeleton height={240} radius={20} />
          </div>
        </section>
      </div>
    </main>
  );
}
