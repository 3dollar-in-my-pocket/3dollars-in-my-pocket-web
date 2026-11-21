import Image from 'next/image';
import Link from 'next/link';
import { POINT_EVENT_PATH, PRIZES } from '@/src/config/PointEvent';
import type { PrizeEntryCount } from '@/src/models/PointEvent';
import { formatPoint } from '@/src/utils/pointEvent';
import styles from '../point.module.css';
import { APP_HOME_LINK, openInAppLink } from './appLink';
import RetryButton from './RetryButton';

function StatePage({ children }: { children: React.ReactNode }) {
  return (
    <main className={`${styles.page} ${styles.pageGray}`}>
      <div className={styles.stateWrap}>
        {children}
      </div>
    </main>
  );
}

/** 상태 ① 앱 밖에서 내 포인트 페이지를 연 경우 (토큰 없음·만료) */
export function OpenInAppScreen({ pageUrl }: { pageUrl: string }) {
  return (
    <StatePage>
      <section className={styles.stateCard}>
        <Image
          src="/events/point/mascot.png"
          alt=""
          width={128}
          height={128}
          className={styles.stateMascot}
          priority
        />
        <h1 className={styles.stateTitle}>가슴속 3천원 앱에서 열어주세요</h1>
        <p className={styles.stateDescription}>
          내 포인트와 응모는 앱에 로그인한 상태에서만
          <br />
          확인할 수 있어요. 앱을 최신 버전으로 업데이트해 주세요.
        </p>
        <a className={styles.cta} href={openInAppLink(pageUrl)}>
          앱에서 열기
        </a>
        <Link className={styles.textLink} href={POINT_EVENT_PATH}>
          이벤트 안내 먼저 보기
        </Link>
      </section>
    </StatePage>
  );
}

/** 상태 ③ 발표 후 미당첨 */
export function LoserScreen({
  entries,
  totalEarned,
}: {
  entries: PrizeEntryCount[];
  totalEarned: number | null;
}) {
  const entrySummary = PRIZES.map((prize) => ({
    prize,
    count: entries.find((entry) => entry.prizeCode === prize.code)?.count ?? 0,
  }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count)
    .map(({ prize, count }) => `${prize.shortName} ${count}회`)
    .join(', ');

  return (
    <StatePage>
      <section className={`${styles.stateCard} ${styles.stateCardTight}`}>
        <div className={styles.sadCircle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/events/point/icons/sad.svg" width={44} height={44} alt="" />
        </div>
        <h1 className={styles.stateTitle}>아쉽게도 이번엔 당첨되지 않았어요</h1>
        <p className={styles.stateDescription}>
          {entrySummary ? `${entrySummary} 응모해 주셨어요.` : '이벤트에 참여해 주셔서 고마워요.'}
          <br />
          다음 이벤트에서 꼭 다시 만나요!
        </p>
        {totalEarned !== null && (
          <div className={styles.summaryBox}>
            <span>이번 이벤트에서 모은 포인트</span>
            <span>{formatPoint(totalEarned)}</span>
          </div>
        )}
        <a className={`${styles.cta} ${styles.ctaSecondary}`} href={APP_HOME_LINK}>
          홈으로 가기
        </a>
      </section>
    </StatePage>
  );
}

export function ErrorScreen() {
  return (
    <StatePage>
      <section className={styles.stateCard}>
        <h1 className={styles.stateTitle}>포인트 정보를 불러오지 못했어요</h1>
        <p className={styles.stateDescription}>인터넷 연결을 확인하고 다시 시도해 주세요.</p>
        <RetryButton />
      </section>
    </StatePage>
  );
}
