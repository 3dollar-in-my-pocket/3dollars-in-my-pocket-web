import { NextRequest, NextResponse } from 'next/server';

// SDUI 가게 프리뷰 프록시 (마커 탭 상세 시트).
// 앱과 동일: GET /api/v1/screen/store/{storeId}/preview
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;

  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://threedollars.co.kr';
    const origin = new URL(base).origin;
    const url = `${origin}/api/v1/screen/store/${storeId}/preview`;

    const headers: HeadersInit = {};
    const deviceLatitude = request.headers.get('X-Device-Latitude');
    const deviceLongitude = request.headers.get('X-Device-Longitude');
    if (deviceLatitude) headers['X-Device-Latitude'] = deviceLatitude;
    if (deviceLongitude) headers['X-Device-Longitude'] = deviceLongitude;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch store preview',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
