import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function checkLecturerAuth(user: any) {
  if (!user || (user.role !== 'LECTURER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return false;
  }
  return true;
}

// GET: Lecturer fetches their courses
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!checkLecturerAuth(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const courses = await prisma.course.findMany({
      where: { createdBy: userId },
      include: {
        _count: {
          select: {
            enrollments: true,
            quizzes: true,
            videos: true,
            lectureSlides: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error('GET /api/lecturer/courses error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST: Lecturer creates a new course
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!checkLecturerAuth(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { code, title, description, category, level, year, period } = body;

    if (!code || !title) {
      return NextResponse.json({ error: 'Code and title are required' }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        code,
        title,
        description,
        category,
        level,
        year,
        period,
        createdBy: userId,
      },
    });

    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/lecturer/courses error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create course' },
      { status: 500 }
    );
  }
}
