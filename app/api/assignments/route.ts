import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET – List all assignments
export async function GET() {
  try {
    await requireAuth();
    const assignments = await prisma.assignment.findMany({
      include: {
        creator: { select: { name: true, email: true } },
        submissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(assignments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

// POST – Create a new assignment
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

    const assignment = await prisma.assignment.create({
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
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}

// PUT – Update an assignment
export async function PUT(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const body = await req.json();
    const { id, title, description, embedUrl, formUrl, dueDate, maxScore, fileUrl, contentType, isPublished } = body;

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    const assignment = await prisma.assignment.update({
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
    return NextResponse.json(assignment);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

// DELETE – Delete an assignment
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }
    await prisma.assignment.delete({ where: { id } });
    return NextResponse.json({ message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}