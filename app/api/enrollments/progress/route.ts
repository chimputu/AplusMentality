import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT - Update lesson progress
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

    // Get enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 404 }
      );
    }

    // Get total lessons in the course
    const totalLessons = await prisma.lesson.count({
      where: {
        module: {
          courseId,
        },
      },
    });

    if (totalLessons === 0) {
      return NextResponse.json(
        { error: 'No lessons in this course' },
        { status: 400 }
      );
    }

    // Get completed lessons count
    // You'll need a LessonCompletion model for this
    // For now, we'll just update progress by 10%
    // In a real implementation, you'd track which lessons are completed

    const newProgress = Math.min(enrollment.progress + 10, 100);

    const updated = await prisma.enrollment.update({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
      data: { progress: newProgress },
    });

    return NextResponse.json({
      message: 'Progress updated',
      progress: updated.progress,
    });
  } catch (error: any) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}