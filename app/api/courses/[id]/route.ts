import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get a single course with all details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const { id } = params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                video: true,
                slides: true,
                quiz: true,
              },
            },
          },
        },
        enrollments: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        creator: {
          select: { name: true, email: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}