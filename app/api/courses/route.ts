import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAuthUser } from '@/lib/auth';
import { getScopeContext, buildCourseScopeWhere } from '@/lib/auth/scope';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const institutionId =
        searchParams.get('institutionId') || searchParams.get('institution');

    const programmeId = searchParams.get('programmeId');
    const year = searchParams.get('year');
    const period = searchParams.get('period');
    const all = searchParams.get('all');

    const hasFilters =
        institutionId || programmeId || year || period || all;

    let userId: string;
    let role: string;

    if (hasFilters) {
      const auth = await getAuthUser(['ADMIN', 'SUPER_ADMIN']);
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

    const where: any = role === 'ADMIN' ? {} : { isPublished: true };

    if (institutionId) {
      where.programme = {
        institutionId,
      };
    }

    if (programmeId) where.programmeId = programmeId;
    if (year) where.year = parseInt(year);
    if (period !== null) where.period = period === '' ? '' : period;

    if (hasFilters) {
      const courses = await prisma.course.findMany({
        where,
        select: {
          id: true,
          code: true,
          title: true,
          description: true,
          category: true,
          level: true,
          thumbnail: true,
          programmeId: true,
          year: true,
          period: true,
          isPublished: true,
          programme: {
            select: {
              id: true,
              name: true,
              shortName: true,
              code: true,
              institutionId: true,
              institution: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  shortName: true,
                },
              },
            },
          },
        },
        orderBy: [{ code: 'asc' }, { title: 'asc' }],
      });

      return NextResponse.json({ data: courses, count: courses.length });
    }

    // SECURITY: Scope the query to the user's university, year, and semester
    // so students only see their own courses, not all published courses
    const scope = await getScopeContext();
    const scopeWhere = buildCourseScopeWhere(scope);

    const courses = await prisma.course.findMany({
      where: { ...where, ...scopeWhere },
      include: {
        programme: {
          select: {
            id: true,
            name: true,
            shortName: true,
            code: true,
            institutionId: true,
            institution: {
              select: {
                id: true,
                name: true,
                slug: true,
                shortName: true,
              },
            },
          },
        },
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

export async function POST(req: NextRequest) {
  try {
    const { userId, user } = await requireAuth(['ADMIN', 'SUPER_ADMIN', 'LECTURER']);

    const body = await req.json();

    const {
      code,
      title,
      description,
      category,
      level,
      thumbnail,
      institutionId,
      programmeId,
      year,
      period,
    } = body;

    if (!code || !title) {
      return NextResponse.json(
          { error: 'Code and title are required' },
          { status: 400 }
      );
    }

    if (!programmeId || year === undefined || year === null || year === '') {
      return NextResponse.json(
          { error: 'Programme and year are required' },
          { status: 400 }
      );
    }

    const programme = await prisma.programme.findUnique({
      where: { id: programmeId },
      select: {
        id: true,
        institutionId: true,
      },
    });

    if (!programme) {
      return NextResponse.json(
          { error: 'Programme not found' },
          { status: 404 }
      );
    }

    // LECTURER can only create courses within their own institution
    if (user.role === 'LECTURER' && user.institutionId && programme.institutionId !== user.institutionId) {
      return NextResponse.json(
          { error: 'Forbidden: You can only create courses in your own institution' },
          { status: 403 }
      );
    }

    // ADMIN can only create courses within their own institution (SUPER_ADMIN bypasses this)
    if (user.role === 'ADMIN' && user.institutionId && programme.institutionId !== user.institutionId) {
      return NextResponse.json(
          { error: 'Forbidden: You can only create courses in your own institution' },
          { status: 403 }
      );
    }

    if (institutionId && programme.institutionId !== institutionId) {
      return NextResponse.json(
          { error: 'Programme does not belong to the selected institution' },
          { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        code,
        title,
        description: description || null,
        category: category || null,
        level: level || null,
        thumbnail: thumbnail || null,
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
        programme: {
          select: {
            id: true,
            name: true,
            institution: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error('Error creating course:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
          {
            error:
                'A course with this code already exists for this programme/year/period combination',
          },
          { status: 400 }
      );
    }

    return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId, role } = await requireAuth(['ADMIN', 'SUPER_ADMIN']);
    const body = await req.json();

    const {
      id,
      code,
      title,
      description,
      category,
      level,
      thumbnail,
      isPublished,
      programmeId,
      year,
      period,
    } = body;

    if (!id) {
      return NextResponse.json(
          { error: 'Course ID is required' },
          { status: 400 }
      );
    }

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
        programmeId,
        year:
            year !== undefined && year !== null
                ? parseInt(String(year))
                : undefined,
        period,
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

export async function DELETE(req: NextRequest) {
  try {
    const { userId, role } = await requireAuth(['ADMIN', 'SUPER_ADMIN']);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
          { error: 'Course ID is required' },
          { status: 400 }
      );
    }

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