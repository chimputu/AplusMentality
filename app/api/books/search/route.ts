// app/api/books/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchBooks } from '@/lib/books';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const limitParam = searchParams.get('limit');
    const limit = Math.min(parseInt(limitParam || '20', 10), 40);

    if (query.length < 2) {
      return NextResponse.json({
        results: [],
        count: 0,
        message: 'Search query must be at least 2 characters',
      });
    }

    const results = await searchBooks(query, limit);

    return NextResponse.json({
      results,
      count: results.length,
      query,
    });
  } catch (error) {
    console.error('[books/search] Error:', error);
    return NextResponse.json(
      { error: 'Failed to search books. Please try again.' },
      { status: 500 }
    );
  }
}