import { NextRequest } from 'next/server';
import { readRequestAuth } from '@/src/server/authorizedApi';
import { fetchPointHistories } from '@/src/server/pointEvent';
import { toRouteResponse, unauthorizedResponse } from '@/src/server/routeResponse';
import { HISTORY_FILTER_TYPES, parseHistoryFilter } from '@/src/utils/pointEvent';

export async function GET(request: NextRequest) {
  const { token, userAgent } = readRequestAuth(request);
  if (!token) return unauthorizedResponse();

  const { searchParams } = request.nextUrl;
  const filter = parseHistoryFilter(searchParams.get('filter'));
  return toRouteResponse(
    await fetchPointHistories(
      { token, userAgent },
      { cursor: searchParams.get('cursor'), filterTypes: HISTORY_FILTER_TYPES[filter] }
    )
  );
}
