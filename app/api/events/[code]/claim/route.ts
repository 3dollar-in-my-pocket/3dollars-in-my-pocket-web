import { NextRequest, NextResponse } from 'next/server';
import { readRequestAuth } from '@/src/server/authorizedApi';
import { claimPromotionReward } from '@/src/server/promotion';
import { unauthorizedResponse } from '@/src/server/routeResponse';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { token, userAgent } = readRequestAuth(request);
  if (!token) return unauthorizedResponse();

  const result = await claimPromotionReward(code, token, userAgent);

  switch (result.status) {
    case 'ok':
      return NextResponse.json({ status: 'ok', reward: result.data });
    case 'unauthorized':
      return unauthorizedResponse();
    case 'error':
      return NextResponse.json(
        { status: 'error', message: result.message },
        { status: 502 }
      );
  }
}
