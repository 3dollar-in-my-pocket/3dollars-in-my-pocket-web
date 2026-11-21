import { NextRequest } from 'next/server';
import { readRequestAuth } from '@/src/server/authorizedApi';
import { fetchPointHistories } from '@/src/server/pointEvent';
import { toRouteResponse, unauthorizedResponse } from '@/src/server/routeResponse';

export async function GET(request: NextRequest) {
  const { token, userAgent } = readRequestAuth(request);
  if (!token) return unauthorizedResponse();

  const cursor = request.nextUrl.searchParams.get('cursor');
  return toRouteResponse(await fetchPointHistories({ token, userAgent }, cursor));
}
