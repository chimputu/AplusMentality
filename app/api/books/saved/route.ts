// app/api/books/saved/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ============================================
// GET — list current user's saved books
// ============================================
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json(
        { error: 'Please sign in to view your saved books' },
        { status: 401 }
      );
    }

    const saved = await prisma.savedBook.findMany({
      where: { userId: auth.userId },
      include: {
        book: true,
      },
      orderBy: { savedAt: 'desc' },
    });

    // Flatten into a clean response
    const books = saved.map((s) => ({
      savedId: s.id,
      savedAt: s.savedAt,
      ...s.book,
    }));

    return NextResponse.json({
      books,
      count: books.length,
    });
  } catch (error) {
    console.error('[books/saved GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load saved books' },
      { status: 500 }
    );
  }
}

// ============================================
// POST — save a book to user's library
// ============================================
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json(
        { error: 'Please sign in to save books' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      source,
      sourceId,
      title,
      authors,
      coverUrl,
      publishYear,
      description,
      subjects,
      language,
      readUrl,
      downloadPdfUrl,
      downloadEpubUrl,
    } = body;

    // Validate required fields
    if (!source || !sourceId || !title) {
      return NextResponse.json(
        { error: 'Missing required book information' },
        { status: 400 }
      );
    }

    if (!['gutenberg', 'openlibrary'].includes(source)) {
      return NextResponse.json(
        { error: 'Invalid source' },
        { status: 400 }
      );
    }

    // Upsert the book (create if it doesn't exist, otherwise reuse)
    const book = await prisma.book.upsert({
      where: {
        source_sourceId: { source, sourceId },
      },
      create: {
        source,
        sourceId,
        title,
        authors: authors || 'Unknown',
        coverUrl: coverUrl || null,
        publishYear: publishYear || null,
        description: description || null,
        subjects: subjects || null,
        language: language || null,
        readUrl: readUrl || null,
        downloadPdfUrl: downloadPdfUrl || null,
        downloadEpubUrl: downloadEpubUrl || null,
      },
      update: {
        // Refresh metadata on save
        title,
        authors: authors || 'Unknown',
        coverUrl: coverUrl || null,
        publishYear: publishYear || null,
        description: description || null,
        subjects: subjects || null,
        language: language || null,
        readUrl: readUrl || null,
        downloadPdfUrl: downloadPdfUrl || null,
        downloadEpubUrl: downloadEpubUrl || null,
      },
    });

    // Check if user already saved this book
    const existing = await prisma.savedBook.findUnique({
      where: {
        userId_bookId: {
          userId: auth.userId,
          bookId: book.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadySaved: true,
        book,
      });
    }

    // Save to library
    const saved = await prisma.savedBook.create({
      data: {
        userId: auth.userId,
        bookId: book.id,
      },
    });

    return NextResponse.json({
      ok: true,
      saved,
      book,
    });
  } catch (error) {
    console.error('[books/saved POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save book' },
      { status: 500 }
    );
  }
}