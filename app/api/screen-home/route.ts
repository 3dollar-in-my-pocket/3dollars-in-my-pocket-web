import { NextResponse } from 'next/server';

// SDUI 홈 필터 화면 프록시.
// 앱과 동일한 게이트웨이(https://threedollars.co.kr/api/v1/screen/home)를 사용한다.
// 웹 프록시 base(`.../web`)에는 이 엔드포인트가 없으므로 origin 기준으로 호출한다.
export async function GET() {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://threedollars.co.kr';
    const origin = new URL(base).origin;
    const url = `${origin}/api/v1/screen/home`;

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      // 필터 구성은 자주 바뀌지 않으므로 짧게 캐시.
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch home filter screen',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
