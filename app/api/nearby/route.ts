import { NextRequest, NextResponse } from 'next/server';

// nearby 로 그대로 흘려보낼 필터 파라미터. 앱의 dynamicParams 와 동일한 키를 사용한다.
const FORWARDED_PARAMS = [
  'distanceM',
  'sortType',
  'categoryIds',
  'targetStores',
  'filterConditions',
  'filterOpenStatuses',
] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mapLatitude = searchParams.get('mapLatitude');
  const mapLongitude = searchParams.get('mapLongitude');

  if (!mapLatitude || !mapLongitude) {
    return NextResponse.json(
      { error: 'mapLatitude and mapLongitude are required' },
      { status: 400 }
    );
  }

  try {
    const deviceLatitude = request.headers.get('X-Device-Latitude');
    const deviceLongitude = request.headers.get('X-Device-Longitude');

    const query = new URLSearchParams();
    query.set('mapLatitude', mapLatitude);
    query.set('mapLongitude', mapLongitude);
    query.set('sortType', searchParams.get('sortType') || 'DISTANCE_ASC');
    if (!searchParams.get('distanceM')) {
      query.set('distanceM', '1000');
    }
    for (const key of FORWARDED_PARAMS) {
      const value = searchParams.get(key);
      if (value) {
        query.set(key, value);
      }
    }

    // 앱과 동일한 게이트웨이(origin/api) 사용. `/web` 게이트웨이는 서버사이드 호출을 차단(503)한다.
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://threedollars.co.kr';
    const origin = new URL(base).origin;
    const url = `${origin}/api/v1/stores/nearby?${query.toString()}`;
    const headers: HeadersInit = {};

    if (deviceLatitude) {
      headers['X-Device-Latitude'] = deviceLatitude;
    }
    if (deviceLongitude) {
      headers['X-Device-Longitude'] = deviceLongitude;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch nearby stores', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
