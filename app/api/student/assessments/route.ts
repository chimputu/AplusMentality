// app/api/student/assessments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — list assessments available to the student
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(['STUDENT']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student's profile
    const student = await prisma.user.findUnique({
      where: { clerkId: auth.userId },
    });

    if (!student) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Find courses matching student's academic profile
    const studentCourses = await prisma.course.findMany({
      where: {
        programmeId: student.programmeId,
        year: student.year,
        period: student.period ?? '',
        isPublished: true,
      },
      select: { id: true },
    });

    const courseIds = studentCourses.map(c => c.id);

    if (courseIds.length === 0) {
      return NextResponse.json([]);
    }

    const assessments = await prisma.assessment.findMany({
      where: {
        courseId: { in: courseIds },
        isPublished: true,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
        attempts: {
          where: { userId: student.id },
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error('[student/assessments GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}
