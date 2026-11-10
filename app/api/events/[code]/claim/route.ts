import { NextRequest, NextResponse } from 'next/server';
import { claimPromotionReward, EVENT_TOKEN_COOKIE } from '@/src/server/promotion';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const token =
    request.headers.get('authorization') ??
    request.cookies.get(EVENT_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ status: 'unauthorized' }, { status: 401 });
  }

  const result = await claimPromotionReward(
    code,
    token,
    request.headers.get('user-agent')
  );

  switch (result.status) {
    case 'ok':
      return NextResponse.json({ status: 'ok', reward: result.data });
    case 'unauthorized':
      return NextResponse.json({ status: 'unauthorized' }, { status: 401 });
    case 'error':
      return NextResponse.json(
        { status: 'error', message: result.message },
        { status: 502 }
      );
  }
}
