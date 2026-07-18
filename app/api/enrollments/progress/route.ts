import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await requireAuth(['STUDENT']);
    const body = await req.json();
    const { courseId, lessonId } = body;

    if (!courseId || !lessonId) {
      return NextResponse.json(
        { error: 'Course ID and Lesson ID are required' },
        { status: 400 }
      );
    }

    // Check if already completed
    const existing = await prisma.lessonCompletion.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Lesson already completed' },
        { status: 200 }
      );
    }

    // Create completion record
    await prisma.lessonCompletion.create({
      data: {
        userId,
        lessonId,
      },
    });

    // Recalculate progress for this course
    const totalLessons = await prisma.lesson.count({
      where: {
        module: {
          courseId,
        },
      },
    });

    const completedLessons = await prisma.lessonCompletion.count({
      where: {
        userId,
        lesson: {
          module: {
            courseId,
          },
        },
      },
    });

    const progress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

    // Update enrollment progress
    await prisma.enrollment.update({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
      data: { progress },
    });

    return NextResponse.json({
      message: 'Progress updated',
      progress,
      completed: true,
    });
  } catch (error: any) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}