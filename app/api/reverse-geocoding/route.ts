import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  
  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    );
  }

  try {
    const url = `https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc?request=coordsToaddr&coords=${lng},${lat}&orders=legalcode,admcode,addr,roadaddr&output=json`;
    const response = await fetch(url, {
      headers: {
        'x-ncp-apigw-api-key-id': process.env.NAVER_MAP_CLIENT_ID || '',
        'x-ncp-apigw-api-key': process.env.NAVER_MAP_CLIENT_SECRET || ''
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Naver API failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get address', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}