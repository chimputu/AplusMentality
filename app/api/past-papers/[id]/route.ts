// app/api/past-papers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — fetch one past paper
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
    const paper = await prisma.pastPaper.findUnique({
      where: { id },
      include: { creator: { select: { name: true, email: true } } },
    });

    if (!paper) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(paper);
  } catch (error) {
    console.error('[past-paper GET] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// PUT — update a past paper (admin)
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
      courseCode,
      year,
      semester,
      category,
      fileUrl,
      fileType,
      fileSize,
    } = body;

    const paper = await prisma.pastPaper.update({
      where: { id },
      data: {
        title,
        description: description || null,
        courseCode: courseCode || null,
        year: year ? parseInt(String(year)) : null,
        semester: semester || null,
        category: category || 'final_exam',
        fileUrl,
        fileType: fileType || null,
        fileSize: fileSize ? parseInt(String(fileSize)) : null,
      },
    });

    return NextResponse.json(paper);
  } catch (error: any) {
    console.error('[past-paper PUT] Error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update' },
      { status: 500 }
    );
  }
}

// DELETE — delete a past paper (admin)
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
    await prisma.pastPaper.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[past-paper DELETE] Error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to delete' },
      { status: 500 }
    );
  }
}