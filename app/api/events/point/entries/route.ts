import { NextRequest, NextResponse } from 'next/server';
import { readRequestAuth } from '@/src/server/authorizedApi';
import { enterRaffle } from '@/src/server/pointEvent';
import { unauthorizedResponse } from '@/src/server/routeResponse';
import { isUuid } from '@/src/utils/pointEvent';

/** 같은 requestKey 로 이미 처리된 응모 — 실패가 아니라 성공으로 본다 */
const ALREADY_PROCESSED = new Set(['already_used_point', 'already_entered_raffle']);

/**
 * 응모 1회.
 * 응답: { status: 'ok' } | { status: 'unauthorized' }
 *     | { status: 'error', retryable, code?, message? }
 * retryable 이면 클라이언트가 같은 requestKey 로 다시 보낸다 (연결 실패·5xx).
 */
export async function POST(request: NextRequest) {
  const { token, userAgent } = readRequestAuth(request);
  if (!token) return unauthorizedResponse();

  const body = (await request.json().catch(() => null)) as
    | { raffleId?: unknown; requestKey?: unknown }
    | null;
  const raffleId = typeof body?.raffleId === 'string' && /^\d+$/.test(body.raffleId) ? body.raffleId : null;
  const requestKey = isUuid(body?.requestKey) ? body.requestKey : null;
  if (!raffleId || !requestKey) {
    return NextResponse.json(
      { status: 'error', retryable: false, message: '응모 정보가 올바르지 않아요.' },
      { status: 400 }
    );
  }

  const result = await enterRaffle({ token, userAgent }, raffleId, requestKey);
  if (result.status === 'ok') return NextResponse.json({ status: 'ok' });
  if (result.status === 'unauthorized') return unauthorizedResponse();
  if (result.httpStatus === 409 && result.error && ALREADY_PROCESSED.has(result.error)) {
    return NextResponse.json({ status: 'ok' });
  }

  const retryable = result.httpStatus === undefined || result.httpStatus >= 500;
  return NextResponse.json(
    {
      status: 'error',
      retryable,
      code: result.error,
      message: retryable ? undefined : result.message,
    },
    { status: retryable ? 502 : 400 }
  );
}
