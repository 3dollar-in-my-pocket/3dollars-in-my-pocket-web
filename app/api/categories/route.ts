import { NextResponse } from 'next/server';

// 음식 카테고리 목록 프록시 (카테고리 필터용).
// 앱과 동일: GET /api/v4/store/categories
export async function GET() {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://threedollars.co.kr';
    const origin = new URL(base).origin;
    const url = `${origin}/api/v4/store/categories`;

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 3600 },
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
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
