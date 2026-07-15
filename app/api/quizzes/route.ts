import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List all quizzes
export async function GET() {
  try {
    await requireAuth();

    const quizzes = await prisma.quiz.findMany({
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
        lessons: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

// POST - Create a new quiz
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(['ADMIN']);
    const body = await req.json();
    const { title, description, embedUrl, formUrl, dueDate } = body;

    if (!title || !embedUrl || !formUrl) {
      return NextResponse.json(
        { error: 'Title, embed URL, and form URL are required' },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        embedUrl,
        formUrl,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: userId,
        isPublished: true,
      },
      include: {
        creator: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error: any) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
}

// PUT - Update a quiz
export async function PUT(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const body = await req.json();
    const { id, title, description, embedUrl, formUrl, dueDate, isPublished } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        title,
        description,
        embedUrl,
        formUrl,
        dueDate: dueDate ? new Date(dueDate) : null,
        isPublished,
      },
    });

    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error('Error updating quiz:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update quiz' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a quiz
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    await prisma.quiz.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Quiz deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting quiz:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete quiz' },
      { status: 500 }
    );
  }
}