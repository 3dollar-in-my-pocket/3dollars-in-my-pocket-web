import { NextRequest, NextResponse } from 'next/server';
import { readRequestAuth } from '@/src/server/authorizedApi';
import { searchAddresses } from '@/src/server/pointEvent';
import { unauthorizedResponse } from '@/src/server/routeResponse';

const MAX_QUERY_LENGTH = 80;

/**
 * 주소 검색 → GET /v1/addresses/search (size 는 웹 서버에서 고정)
 * 응답: { status: 'ok', data: { contents, nextCursor, hasMore } } | { status: 'unauthorized' }
 *     | { status: 'error', code?, message? }
 * code=invalid_cursor 면 클라이언트가 message 없이 커서를 비우고 첫 페이지부터 다시 검색한다.
 */
export async function GET(request: NextRequest) {
  const { token, userAgent } = readRequestAuth(request);
  if (!token) return unauthorizedResponse();

  const query = request.nextUrl.searchParams.get('query')?.trim() ?? '';
  const cursor = request.nextUrl.searchParams.get('cursor');
  if (!query || query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { status: 'error', message: `검색어를 1~${MAX_QUERY_LENGTH}자로 입력해 주세요.` },
      { status: 400 }
    );
  }

  const result = await searchAddresses({ token, userAgent }, { query, cursor });
  switch (result.status) {
    case 'ok':
      return NextResponse.json({
        status: 'ok',
        data: {
          contents: result.data.contents ?? [],
          nextCursor: result.data.cursor?.nextCursor ?? null,
          hasMore: result.data.cursor?.hasMore === true,
        },
      });
    case 'unauthorized':
      return unauthorizedResponse();
    case 'error':
      return NextResponse.json(
        { status: 'error', code: result.error, message: result.message },
        { status: result.httpStatus && result.httpStatus < 500 ? 400 : 502 }
      );
  }
}
