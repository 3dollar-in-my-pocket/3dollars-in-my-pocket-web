import { NextResponse } from 'next/server';
import { createApiUrl } from '@/src/server/upstream';

// 음식 카테고리 목록 (카테고리 필터용).
export async function GET() {
  try {
    const response = await fetch(createApiUrl('/api/v4/store/categories'), {
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
