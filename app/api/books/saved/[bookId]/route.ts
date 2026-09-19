// app/api/books/saved/[bookId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ============================================
// DELETE — remove a book from user's library
// ============================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json(
        { error: 'Please sign in to remove books' },
        { status: 401 }
      );
    }

    const { bookId } = await params;

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Delete only if it belongs to this user
    const result = await prisma.savedBook.deleteMany({
      where: {
        userId: auth.userId,
        bookId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Book not found in your library' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[books/saved DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove book' },
      { status: 500 }
    );
  }
}