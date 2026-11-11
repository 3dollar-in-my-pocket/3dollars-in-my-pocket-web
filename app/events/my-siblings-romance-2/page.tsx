import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import {
  EVENT_TOKEN_COOKIE,
  fetchMyPromotionResult,
} from '@/src/server/promotion';
import ClaimReward from './ClaimReward';
import RetryButton from './RetryButton';
import styles from './page.module.css';

const PROMOTION_CODE = 'MY_SIBLINGS_ROMANCE_2';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '연애남매2 이벤트 당첨 확인',
  robots: { index: false, follow: false },
};

type ViewState = 'winner' | 'loser' | 'login' | 'error';

async function resolveViewState(): Promise<ViewState> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const token =
    headerStore.get('authorization') ??
    cookieStore.get(EVENT_TOKEN_COOKIE)?.value;

  if (!token) return 'login';

  const result = await fetchMyPromotionResult(
    PROMOTION_CODE,
    token,
    headerStore.get('user-agent')
  );

  switch (result.status) {
    case 'ok':
      return result.data.isWinner ? 'winner' : 'loser';
    case 'unauthorized':
      return 'login';
    case 'error':
      return 'error';
  }
}

function Hero({ dimmed = false }: { dimmed?: boolean }) {
  return (
    <div className={dimmed ? `${styles.hero} ${styles.heroDimmed}` : styles.hero}>
      <Image
        src="/events/my-siblings-romance-2/hero.jpg"
        alt="연애남매2 x 가슴속 3천원 이벤트"
        fill
        priority
        sizes="(max-width: 480px) 100vw, 440px"
        className={styles.heroImage}
      />
    </div>
  );
}

function EventMain() {
  return (
    <>
      <Hero />
      <span className={styles.chip}>당첨자 발표</span>
      <h1 className={styles.title}>
        연애남매2 투표 이벤트
        <br />
        당첨 결과를 확인해 보세요
      </h1>
      <p className={styles.description}>
        투표에 댓글을 남겨 주신 분들 중 30명을 추첨해 웨이브 이용권을 드려요.
      </p>
      <div className={styles.card}>
        <div className={styles.row}>
          <span>투표 기간</span>
          <span>11월 9일(월) ~ 11월 29일(일)</span>
        </div>
        <div className={styles.row}>
          <span>당첨 인원</span>
          <span>30명</span>
        </div>
        <div className={styles.row}>
          <span>경품</span>
          <span>웨이브 광고형 스탠다드 1개월</span>
        </div>
      </div>
      <div className={styles.spacer} />
      <Link
        href="?step=result"
        className={`${styles.button} ${styles.primary}`}
      >
        당첨 확인하기
      </Link>
    </>
  );
}

export default async function MySiblingsRomance2Page({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step } = await searchParams;

  if (step !== 'result') {
    return (
      <main className={styles.page}>
        <div className={styles.content}>
          <EventMain />
        </div>
      </main>
    );
  }

  const state = await resolveViewState();

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        {state === 'winner' && (
          <>
            <Hero />
            <ClaimReward code={PROMOTION_CODE} />
          </>
        )}

        {state === 'loser' && (
          <>
            <Hero dimmed />
            <span className={`${styles.chip} ${styles.chipGray}`}>미당첨</span>
            <h1 className={styles.title}>
              아쉽지만 이번엔
              <br />
              당첨되지 않았어요
            </h1>
            <p className={styles.description}>
              투표에 참여해 주셔서 고마워요. 다음 이벤트도 가슴속 3천원에서 알려드릴게요.
            </p>
          </>
        )}

        {state === 'login' && (
          <div className={styles.center}>
            <h1 className={styles.title}>로그인하고 확인해 주세요</h1>
            <p className={styles.description}>
              당첨 결과는 이벤트에 참여한 계정으로 가슴속 3천원 앱에 로그인한 상태에서 볼 수 있어요.
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className={styles.center}>
            <h1 className={styles.title}>결과를 불러오지 못했어요</h1>
            <p className={styles.description}>
              인터넷 연결을 확인하고 다시 시도해 주세요.
            </p>
            <div className={styles.spacer} />
            <RetryButton />
          </div>
        )}
      </div>
    </main>
  );
}
