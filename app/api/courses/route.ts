import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List all courses
export async function GET() {
  try {
    // ✅ Using your requireAuth function
    const { userId, role, user } = await requireAuth();
    
    console.log(`📚 User ${user.email} (${role}) fetching courses`);

    // If student, only show published courses
    const where = role === 'ADMIN' ? {} : { isPublished: true };

    const courses = await prisma.course.findMany({
      where,
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                video: true,
                slides: true,
                quiz: true,
              },
            },
          },
        },
        enrollments: {
          where: { userId },
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST - Create a new course (Admin only)
export async function POST(req: NextRequest) {
  try {
    // ✅ Require ADMIN role
    const { userId, role, user } = await requireAuth(['ADMIN']);
    
    console.log(`📝 Admin ${user.email} creating course`);

    const body = await req.json();
    const { code, title, description, category, level, thumbnail } = body;

    // Validate required fields
    if (!code || !title) {
      return NextResponse.json(
        { error: 'Code and title are required' },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        code,
        title,
        description,
        category,
        level,
        thumbnail,
        createdBy: userId, // Using clerkId from requireAuth
        isPublished: true,
      },
      include: {
        creator: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error('Error creating course:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

// PUT - Update a course (Admin only)
export async function PUT(req: NextRequest) {
  try {
    const { userId, role } = await requireAuth(['ADMIN']);
    const body = await req.json();
    const { id, code, title, description, category, level, thumbnail, isPublished } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Optional: Check if user owns this course or is admin
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      select: { createdBy: true },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Only allow if user created it or is admin
    if (existingCourse.createdBy !== userId && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only edit your own courses' },
        { status: 403 }
      );
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        code,
        title,
        description,
        category,
        level,
        thumbnail,
        isPublished,
      },
    });

    return NextResponse.json(course);
  } catch (error: any) {
    console.error('Error updating course:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a course (Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const { userId, role } = await requireAuth(['ADMIN']);
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Check if user owns this course
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      select: { createdBy: true },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (existingCourse.createdBy !== userId && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only delete your own courses' },
        { status: 403 }
      );
    }

    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting course:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}