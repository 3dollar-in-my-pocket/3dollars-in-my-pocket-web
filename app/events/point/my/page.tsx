import type { Metadata } from 'next';
import { headers } from 'next/headers';
import {
  POINT_EVENT_MY_PATH,
  POINT_EVENT_SCHEDULE,
  PRIZES,
} from '@/src/config/PointEvent';
import { readPageAuth } from '@/src/server/authorizedApi';
import {
  fetchMyPromotionResult,
  fetchMyRaffles,
  fetchPointBalance,
  fetchPointChange,
  fetchPointHistories,
} from '@/src/server/pointEvent';
import {
  isPast,
  kstTodayRange,
  parseDate,
  toKstLocalDateTime,
} from '@/src/utils/pointEvent';
import {
  ErrorScreen,
  LoserScreen,
  OpenInAppScreen,
} from '../_components/StateScreens';
import PointDashboard from './PointDashboard';
import WinnerForm from './WinnerForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '내 포인트',
  robots: { index: false, follow: false },
};

type Session = { token: string; userAgent: string | null };

/**
 * 미당첨 요약용: 이벤트 기간 동안 적립한 포인트 합계 (/changes increaseAmount).
 * endAt 은 포함 시각(23:59:59)이라 1초 뒤를 미포함 끝으로 쓴다. 기간은 /changes 한도(15일) 안이다.
 * 일정이 없거나 실패하면 null (합계 줄을 숨긴다).
 */
async function loadTotalEarned(session: Session): Promise<number | null> {
  const { startAt, endAt } = POINT_EVENT_SCHEDULE;
  if (!startAt || !endAt) return null;
  const change = await fetchPointChange(session, {
    start: toKstLocalDateTime(parseDate(startAt)),
    end: toKstLocalDateTime(new Date(parseDate(endAt).getTime() + 1000)),
  });
  return change.status === 'ok' ? change.data.increaseAmount : null;
}

async function currentPageUrl(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'web.threedollars.co.kr';
  const proto = headerStore.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}${POINT_EVENT_MY_PATH}`;
}

export default async function MyPointPage() {
  const auth = await readPageAuth();
  if (!auth.token) return <OpenInAppScreen pageUrl={await currentPageUrl()} />;
  const session: Session = { token: auth.token, userAgent: auth.userAgent };

  const [balance, histories, raffles, todayChange] = await Promise.all([
    fetchPointBalance(session),
    fetchPointHistories(session),
    fetchMyRaffles(session),
    fetchPointChange(session, kstTodayRange()),
  ]);

  if (balance.status === 'unauthorized' || histories.status === 'unauthorized') {
    return <OpenInAppScreen pageUrl={await currentPageUrl()} />;
  }
  if (balance.status !== 'ok' || histories.status !== 'ok') return <ErrorScreen />;

  // 응모 목록·오늘 적립은 실패해도 페이지는 보여준다 (응모 영역만 오류 문구, 오늘 적립은 숨김).
  const raffleList = raffles.status === 'ok' ? raffles.data.contents : null;
  const todayEarned = todayChange.status === 'ok' ? todayChange.data.increaseAmount : null;
  // 응모 마감: 설정 값이 우선, 없으면 응모 대상 중 가장 늦은 종료 일시(미포함)
  const raffleEnd = raffleList
    ?.map((raffle) => raffle.endDateTime)
    .sort((a, b) => parseDate(a).getTime() - parseDate(b).getTime())
    .at(-1);
  const endAt = POINT_EVENT_SCHEDULE.endAt ?? raffleEnd ?? null;

  if (isPast(POINT_EVENT_SCHEDULE.announceAt)) {
    const [result, totalEarned] = await Promise.all([
      fetchMyPromotionResult(session),
      loadTotalEarned(session),
    ]);
    if (result.status === 'unauthorized') {
      return <OpenInAppScreen pageUrl={await currentPageUrl()} />;
    }
    if (result.status !== 'ok') return <ErrorScreen />;

    if (result.data.isWinner) {
      // 당첨 경품 코드가 내려오지 않으면 경품 이름 없이 '굿즈'로 표시한다.
      const prize = PRIZES.find((item) => item.code === result.data.prizeCode) ?? null;
      return <WinnerForm prize={prize} claimDeadline={POINT_EVENT_SCHEDULE.claimDeadline} />;
    }

    return <LoserScreen raffles={raffleList ?? []} totalEarned={totalEarned} />;
  }

  return (
    <PointDashboard
      initialBalance={balance.data.balance}
      initialHistories={histories.data}
      initialRaffles={raffleList}
      initialTodayEarned={todayEarned}
      endAt={endAt}
      announceAt={POINT_EVENT_SCHEDULE.announceAt}
    />
  );
}
