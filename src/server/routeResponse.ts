import 'server-only';
import { NextResponse } from 'next/server';
import type { ApiResult } from '@/src/server/authorizedApi';

/** ApiResult 를 웹 클라이언트용 JSON 응답({ status, data | message })으로 바꾼다. */
export function toRouteResponse<T>(result: ApiResult<T>) {
  switch (result.status) {
    case 'ok':
      return NextResponse.json({ status: 'ok', data: result.data });
    case 'unauthorized':
      return NextResponse.json({ status: 'unauthorized' }, { status: 401 });
    case 'error':
      return NextResponse.json(
        { status: 'error', message: result.message },
        { status: 502 }
      );
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ status: 'unauthorized' }, { status: 401 });
}
