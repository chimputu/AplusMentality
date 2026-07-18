import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List lessons for a module
export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get('moduleId');

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID is required' },
        { status: 400 }
      );
    }

    const lessons = await prisma.lesson.findMany({
      where: { moduleId },
      include: {
        video: true,
        slides: true,
        quiz: true,
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

// ✅ FIXED POST - Create a new lesson (converts empty strings to null)
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(['ADMIN']);
    const body = await req.json();
    const {
      title,
      description,
      order,
      moduleId,
      videoId,
      slidesId,
      quizId,
    } = body;

    if (!title || !moduleId) {
      return NextResponse.json(
        { error: 'Title and module ID are required' },
        { status: 400 }
      );
    }

    // ✅ Convert empty strings to null to avoid foreign key errors
    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        order: order || 0,
        moduleId,
        videoId: videoId || null,
        slidesId: slidesId || null,
        quizId: quizId || null,
      },
      include: {
        video: true,
        slides: true,
        quiz: true,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}

// PUT - Update a lesson (no changes needed, but keep consistency)
export async function PUT(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const body = await req.json();
    const {
      id,
      title,
      description,
      order,
      videoId,
      slidesId,
      quizId,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        title,
        description,
        order,
        videoId: videoId || null,
        slidesId: slidesId || null,
        quizId: quizId || null,
      },
      include: {
        video: true,
        slides: true,
        quiz: true,
      },
    });

    return NextResponse.json(lesson);
  } catch (error: any) {
    console.error('Error updating lesson:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a lesson
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    await prisma.lesson.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Lesson deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting lesson:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}