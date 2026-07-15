import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get user's enrollments
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const where: any = { userId };
    if (courseId) {
      where.courseId = courseId;
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        course: {
          include: {
            modules: {
              include: { lessons: true },
            },
            creator: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

// POST - Enroll in a course
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(['STUDENT']);
    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId, isPublished: true },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or not available' },
        { status: 404 }
      );
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        courseId,
        userId,
        progress: 0,
      },
      include: {
        course: true,
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error: any) {
    console.error('Error enrolling in course:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}

// DELETE - Unenroll from a course
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    await prisma.enrollment.delete({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });

    return NextResponse.json({ message: 'Unenrolled successfully' });
  } catch (error: any) {
    console.error('Error unenrolling:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to unenroll' },
      { status: 500 }
    );
  }
}