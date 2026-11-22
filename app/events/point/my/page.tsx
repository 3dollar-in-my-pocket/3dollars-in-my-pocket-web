import type { Metadata } from 'next';
import { headers } from 'next/headers';
import {
  POINT_EVENT_MY_PATH,
  POINT_EVENT_SCHEDULE,
  PRIZES,
} from '@/src/config/PointEvent';
import type { PointHistory } from '@/src/models/PointEvent';
import { readPageAuth } from '@/src/server/authorizedApi';
import {
  fetchMyPromotionResult,
  fetchMyRaffles,
  fetchPointBalance,
  fetchPointChange,
  fetchPointHistories,
} from '@/src/server/pointEvent';
import { earnedAmount, isPast, kstTodayRange, parseDate } from '@/src/utils/pointEvent';
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

/** 미당첨 요약용: 이벤트 동안 적립한 포인트 합계 (최대 10페이지까지만 모은다) */
const MAX_SUMMARY_PAGES = 10;

async function currentPageUrl(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'web.threedollars.co.kr';
  const proto = headerStore.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}${POINT_EVENT_MY_PATH}`;
}

export default async function MyPointPage() {
  const auth = await readPageAuth();
  if (!auth.token) return <OpenInAppScreen pageUrl={await currentPageUrl()} />;
  const session = { token: auth.token, userAgent: auth.userAgent };

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
  const todayEarned = todayChange.status === 'ok' ? earnedAmount(todayChange.data) : null;
  // 응모 마감: 설정 값이 우선, 없으면 응모 대상 중 가장 늦은 종료 일시(미포함)
  const raffleEnd = raffleList
    ?.map((raffle) => raffle.endDateTime)
    .sort((a, b) => parseDate(a).getTime() - parseDate(b).getTime())
    .at(-1);
  const endAt = POINT_EVENT_SCHEDULE.endAt ?? raffleEnd ?? null;

  if (isPast(POINT_EVENT_SCHEDULE.announceAt)) {
    const result = await fetchMyPromotionResult(session);
    if (result.status === 'unauthorized') {
      return <OpenInAppScreen pageUrl={await currentPageUrl()} />;
    }
    if (result.status !== 'ok') return <ErrorScreen />;

    if (result.data.isWinner) {
      // 당첨 경품 코드가 내려오지 않으면 경품 이름 없이 '굿즈'로 표시한다.
      const prize = PRIZES.find((item) => item.code === result.data.prizeCode) ?? null;
      return <WinnerForm prize={prize} claimDeadline={POINT_EVENT_SCHEDULE.claimDeadline} />;
    }

    let all: PointHistory[] = histories.data.contents;
    let cursor = histories.data.cursor;
    for (let page = 1; cursor.hasMore && cursor.nextCursor && page < MAX_SUMMARY_PAGES; page++) {
      const next = await fetchPointHistories(session, { cursor: cursor.nextCursor });
      if (next.status !== 'ok') break;
      all = all.concat(next.data.contents);
      cursor = next.data.cursor;
    }
    const totalEarned = cursor.hasMore
      ? null
      : all.reduce((sum, item) => (item.type === 'EARN' ? sum + item.amount : sum), 0);
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
