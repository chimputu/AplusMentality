import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET – List all tests
export async function GET() {
  try {
    await requireAuth();
    const tests = await prisma.test.findMany({
      include: {
        creator: { select: { name: true, email: true } },
        submissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tests);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}

// POST – Create a new test
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(['ADMIN']);
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
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const test = await prisma.test.create({
      data: {
        title,
        description,
        embedUrl,
        formUrl,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore ? parseInt(maxScore) : null,
        fileUrl: fileUrl || null,
        contentType: contentType || 'google_form',
        createdBy: userId,
        isPublished: true,
      },
    });
    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
  }
}

// PUT – Update a test
export async function PUT(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const body = await req.json();
    const { id, title, description, embedUrl, formUrl, dueDate, maxScore, fileUrl, contentType, isPublished } = body;

    if (!id) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    const test = await prisma.test.update({
      where: { id },
      data: {
        title,
        description,
        embedUrl,
        formUrl,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore ? parseInt(maxScore) : null,
        fileUrl: fileUrl || null,
        contentType: contentType || 'google_form',
        isPublished,
      },
    });
    return NextResponse.json(test);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 });
  }
}

// DELETE – Delete a test
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }
    await prisma.test.delete({ where: { id } });
    return NextResponse.json({ message: 'Test deleted successfully' });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 });
  }
}