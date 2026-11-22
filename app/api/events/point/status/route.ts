import { NextRequest, NextResponse } from 'next/server';
import { readRequestAuth } from '@/src/server/authorizedApi';
import { fetchMyRaffles, fetchPointBalance, fetchPointChange } from '@/src/server/pointEvent';
import { unauthorizedResponse } from '@/src/server/routeResponse';
import { kstTodayRange } from '@/src/utils/pointEvent';

/**
 * 응모 뒤 화면 갱신용: 잔액 · 오늘 증감 · 응모 목록(내 응모 횟수 포함).
 * 잔액만 필수이고 나머지는 실패하면 null 로 내려 기존 값을 유지하게 한다.
 */
export async function GET(request: NextRequest) {
  const { token, userAgent } = readRequestAuth(request);
  if (!token) return unauthorizedResponse();
  const session = { token, userAgent };

  const [balance, change, raffles] = await Promise.all([
    fetchPointBalance(session),
    fetchPointChange(session, kstTodayRange()),
    fetchMyRaffles(session),
  ]);
  if (
    balance.status === 'unauthorized' ||
    change.status === 'unauthorized' ||
    raffles.status === 'unauthorized'
  ) {
    return unauthorizedResponse();
  }
  if (balance.status === 'error') {
    return NextResponse.json({ status: 'error', message: balance.message }, { status: 502 });
  }
  return NextResponse.json({
    status: 'ok',
    data: {
      balance: balance.data.balance,
      todayNet: change.status === 'ok' ? change.data.netAmount : null,
      raffles: raffles.status === 'ok' ? raffles.data.contents : null,
    },
  });
}
