import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mapLatitude = searchParams.get('mapLatitude');
  const mapLongitude = searchParams.get('mapLongitude');
  const distanceM = searchParams.get('distanceM') || '1000';
  const sortType = searchParams.get('sortType') || 'DISTANCE_ASC';
  
  if (!mapLatitude || !mapLongitude) {
    return NextResponse.json(
      { error: 'mapLatitude and mapLongitude are required' },
      { status: 400 }
    );
  }

  try {
    const deviceLatitude = request.headers.get('X-Device-Latitude');
    const deviceLongitude = request.headers.get('X-Device-Longitude');

    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/stores/nearby?mapLatitude=${mapLatitude}&mapLongitude=${mapLongitude}&distanceM=${distanceM}&sortType=${sortType}`;
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