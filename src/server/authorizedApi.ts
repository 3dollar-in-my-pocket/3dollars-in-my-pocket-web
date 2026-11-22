import 'server-only';
import { cookies, headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { createApiUrl } from '@/src/server/upstream';

export const EVENT_TOKEN_COOKIE = 'th_event_token';

export type ApiResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'unauthorized' }
  | {
      status: 'error';
      message?: string;
      /** 서버 error 코드 (예: insufficient_point). 연결 실패면 없음 */
      error?: string;
      /** 연결 실패·타임아웃이면 없음 */
      httpStatus?: number;
    };

type ApiEnvelope<T> = {
  ok?: boolean;
  data?: T | null;
  error?: string | null;
  message?: string | null;
};

type RequestOptions = {
  method?: 'GET' | 'POST';
  token: string;
  userAgent: string | null;
  searchParams?: URLSearchParams;
  body?: unknown;
};

/**
 * 인앱 브라우저 토큰으로 서버 API 를 호출한다.
 * 401 / error=unauthorized 는 'unauthorized' 로, 그 밖의 실패는 'error' 로 돌려준다.
 */
export async function requestWithToken<T>(
  pathname: string,
  { method = 'GET', token, userAgent, searchParams, body }: RequestOptions
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(createApiUrl(pathname, searchParams), {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        ...(userAgent ? { 'User-Agent': userAgent } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
    const envelope = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;

    if (response.status === 401 || envelope.error === 'unauthorized') {
      return { status: 'unauthorized' };
    }
    if (!response.ok || envelope.ok === false || envelope.data == null) {
      return {
        status: 'error',
        message: envelope.message ?? undefined,
        error: envelope.error ?? undefined,
        httpStatus: response.status,
      };
    }
    return { status: 'ok', data: envelope.data };
  } catch {
    return { status: 'error' };
  }
}

/** 서버 컴포넌트(페이지)에서 쓰는 토큰·UA. 첫 문서 요청은 헤더, 이후는 proxy 가 옮겨 둔 쿠키. */
export async function readPageAuth(): Promise<{
  token: string | null;
  userAgent: string | null;
}> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  return {
    token:
      headerStore.get('authorization') ??
      cookieStore.get(EVENT_TOKEN_COOKIE)?.value ??
      null,
    userAgent: headerStore.get('user-agent'),
  };
}

/** Route Handler 에서 쓰는 토큰·UA. */
export function readRequestAuth(request: NextRequest): {
  token: string | null;
  userAgent: string | null;
} {
  return {
    token:
      request.headers.get('authorization') ??
      request.cookies.get(EVENT_TOKEN_COOKIE)?.value ??
      null,
    userAgent: request.headers.get('user-agent'),
  };
}
