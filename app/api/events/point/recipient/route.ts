import { NextRequest, NextResponse } from 'next/server';
import { readRequestAuth } from '@/src/server/authorizedApi';
import { submitRecipient } from '@/src/server/pointEvent';
import { unauthorizedResponse } from '@/src/server/routeResponse';
import { toRecipientRequest } from '@/src/utils/pointEvent';

/** 이미 수령 정보를 등록한 당첨자의 재요청 (중복 탭 등) */
const ALREADY_CLAIMED = 'already_claimed_promotion_reward';

/**
 * 당첨자 수령 정보 등록 → POST /v1/promotion/{code}/reward/recipient
 * 응답: { status: 'ok' } | { status: 'unauthorized' }
 *     | { status: 'already_claimed', message? }  — message 노출 후 등록 완료 화면으로
 *     | { status: 'error', message? }            — 서버 message 를 그대로 노출 (errorDetails 는 내리지 않음)
 */
export async function POST(request: NextRequest) {
  const { token, userAgent } = readRequestAuth(request);
  if (!token) return unauthorizedResponse();

  const body = toRecipientRequest(await request.json().catch(() => null));
  if (!body) {
    return NextResponse.json(
      { status: 'error', message: '받으실 정보를 모두 입력하고 동의해 주세요.' },
      { status: 400 }
    );
  }

  const result = await submitRecipient({ token, userAgent }, body);
  switch (result.status) {
    case 'ok':
      return NextResponse.json({ status: 'ok' });
    case 'unauthorized':
      return unauthorizedResponse();
    case 'error':
      if (result.error === ALREADY_CLAIMED) {
        return NextResponse.json(
          { status: 'already_claimed', message: result.message },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { status: 'error', message: result.message },
        { status: result.httpStatus && result.httpStatus < 500 ? 400 : 502 }
      );
  }
}
