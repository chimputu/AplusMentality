import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List all courses
export async function GET(req: NextRequest) {
  try {
    // Support query params for filtering (used by tag form)
    const { searchParams } = new URL(req.url);
    const universityId = searchParams.get('universityId') || searchParams.get('university');
    const programmeId = searchParams.get('programmeId');
    const year = searchParams.get('year');
    const period = searchParams.get('period');
    const all = searchParams.get('all');

    // If filtering params are present, use lighter auth (for tag form)
    const hasFilters = universityId || programmeId || year || period;

    let userId: string;
    let role: string;

    if (hasFilters) {
      const auth = await getAuthUser(['ADMIN']);
      if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = auth.userId;
      role = auth.role;
    } else {
      const authResult = await requireAuth();
      userId = authResult.userId;
      role = authResult.role;
    }

    // If student, only show published courses
    const where: any = role === 'ADMIN' ? {} : { isPublished: true };

    if (universityId) where.universityId = universityId;
    if (programmeId) where.programmeId = programmeId;
    if (year) where.year = parseInt(year);
    if (period !== null) where.period = period === '' ? '' : period;

    // If filtering, return lightweight data
    if (hasFilters || all) {
      const courses = await prisma.course.findMany({
        where,
        select: {
          id: true,
          code: true,
          title: true,
          university: { select: { name: true } },
          programme: { select: { name: true } },
          year: true,
          period: true,
        },
        orderBy: { code: 'asc' },
      });
      return NextResponse.json({ data: courses, count: courses.length });
    }

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
    const { code, title, description, category, level, thumbnail, universityId, programmeId, year, period } = body;

    // Validate required fields
    if (!code || !title) {
      return NextResponse.json(
        { error: 'Code and title are required' },
        { status: 400 }
      );
    }

    if (!universityId || !programmeId || year === undefined) {
      return NextResponse.json(
        { error: 'University, programme, and year are required' },
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
        universityId,
        programmeId,
        year: parseInt(String(year)),
        period: period || null,
        createdBy: userId,
        isPublished: true,
      },
      include: {
        creator: {
          select: { name: true, email: true },
        },
        university: { select: { code: true, name: true } },
        programme: { select: { name: true } },
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error('Error creating course:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A course with this code already exists for this university/programme/year/period combination' },
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