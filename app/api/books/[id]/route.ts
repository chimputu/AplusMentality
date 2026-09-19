// app/api/books/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  fetchGutenbergBook,
  fetchOpenLibraryBook,
} from '@/lib/books';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source');

    if (!id) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    if (!source || !['gutenberg', 'openlibrary'].includes(source)) {
      return NextResponse.json(
        { error: 'Valid "source" query parameter is required (gutenberg or openlibrary)' },
        { status: 400 }
      );
    }

    let book = null;

    if (source === 'gutenberg') {
      book = await fetchGutenbergBook(id);
    } else if (source === 'openlibrary') {
      book = await fetchOpenLibraryBook(id);
    }

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error('[books/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book details' },
      { status: 500 }
    );
  }
}