import { NextRequest, NextResponse } from 'next/server';
import { PRIZES } from '@/src/config/PointEvent';
import { readRequestAuth } from '@/src/server/authorizedApi';
import { enterPrize } from '@/src/server/pointEvent';
import { toRouteResponse, unauthorizedResponse } from '@/src/server/routeResponse';

export async function POST(request: NextRequest) {
  const { token, userAgent } = readRequestAuth(request);
  if (!token) return unauthorizedResponse();

  const body = (await request.json().catch(() => null)) as { prizeCode?: unknown } | null;
  const prizeCode = typeof body?.prizeCode === 'string' ? body.prizeCode : null;
  if (!prizeCode || !PRIZES.some((prize) => prize.code === prizeCode)) {
    return NextResponse.json({ status: 'error', message: '알 수 없는 경품이에요.' }, { status: 400 });
  }

  return toRouteResponse(await enterPrize({ token, userAgent }, prizeCode));
}
