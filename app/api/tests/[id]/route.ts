// app/api/tests/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch a single test
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        creator: {
          select: { name: true, email: true },
        },
        submissions: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json(test);
  } catch (error) {
    console.error('[test-get] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 });
  }
}

// PUT - Update a test (admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(['ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const {
      title,
      description,
      embedUrl,
      formUrl,
      dueDate,
      maxScore,
      fileUrl,
      contentType,
      isPublished,
    } = body;

    const test = await prisma.test.update({
      where: { id },
      data: {
        title,
        description,
        embedUrl,
        formUrl,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore ? parseInt(String(maxScore)) : null,
        fileUrl: fileUrl || null,
        contentType: contentType || 'google_form',
        isPublished,
      },
    });

    return NextResponse.json(test);
  } catch (error: any) {
    console.error('[test-update] Error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update test' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a test (admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(['ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.test.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[test-delete] Error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete test' },
      { status: 500 }
    );
  }
}