import 'server-only';
import { createApiUrl } from '@/src/server/upstream';

export const EVENT_TOKEN_COOKIE = 'th_event_token';

export type PromotionReward = {
  type: string;
  key: string;
};

export type PromotionResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'unauthorized' }
  | { status: 'error'; message?: string };

type ApiEnvelope<T> = {
  ok?: boolean;
  data?: T | null;
  error?: string | null;
  message?: string | null;
};

function upstreamHeaders(token: string, userAgent: string | null): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: token,
    ...(userAgent ? { 'User-Agent': userAgent } : {}),
  };
}

async function requestPromotion<T>(
  pathname: string,
  init: { method: 'GET' | 'POST'; token: string; userAgent: string | null }
): Promise<PromotionResult<T>> {
  try {
    const response = await fetch(createApiUrl(pathname), {
      method: init.method,
      headers: upstreamHeaders(init.token, init.userAgent),
      cache: 'no-store',
    });
    const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;

    if (response.status === 401 || body.error === 'unauthorized') {
      return { status: 'unauthorized' };
    }
    if (!response.ok || body.ok === false || !body.data) {
      return { status: 'error', message: body.message ?? undefined };
    }
    return { status: 'ok', data: body.data };
  } catch {
    return { status: 'error' };
  }
}

export function fetchMyPromotionResult(
  code: string,
  token: string,
  userAgent: string | null
) {
  return requestPromotion<{ isWinner: boolean }>(
    `/api/v1/promotion/${encodeURIComponent(code)}/my-result`,
    { method: 'GET', token, userAgent }
  );
}

export function claimPromotionReward(
  code: string,
  token: string,
  userAgent: string | null
) {
  return requestPromotion<PromotionReward>(
    `/api/v1/promotion/${encodeURIComponent(code)}/reward/claim`,
    { method: 'POST', token, userAgent }
  );
}
