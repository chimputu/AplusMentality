import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAuthUser } from '@/lib/auth';
import { buildCourseResourceScopeWhereFromUser, isUserAuthorizedForCourse } from '@/lib/auth/scope';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const courseId = searchParams.get('courseId');

    const institutionId =
        searchParams.get('institutionId') || searchParams.get('institution');

    const universityId =
        searchParams.get('universityId') || searchParams.get('university');

    const where: any = {};

    if (courseId) where.courseId = courseId;

    if (institutionId) {
      where.course = {
        ...where.course,
        programme: {
          institutionId,
        },
      };
    } else if (universityId) {
      where.course = {
        ...where.course,
        programme: { institutionId: universityId },
      };
    }

    // SECURITY: Filter by user's academic scope (university, year, period)
    const scopeWhere = buildCourseResourceScopeWhereFromUser(auth.user);
    if (scopeWhere.course) {
      where.course = { ...where.course, ...scopeWhere.course };
    }

    const tests = await prisma.test.findMany({
      where,
      include: {
        creator: {
          select: { name: true, email: true },
        },
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            programme: {
              select: {
                id: true,
                name: true,
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
        },
        submissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tests);
  } catch (error) {
    console.error('[tests GET] Error:', error);
    return NextResponse.json(
        { error: 'Failed to fetch tests' },
        { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(['TUTOR', 'LECTURER', 'ADMIN', 'SUPER_ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = auth.userId;
    const body = await req.json();

    const {
      title,
      description,
      embedUrl,
      formUrl,
      dueDate,
      maxScore,
      fileUrl,
      contentType,
      courseId,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!courseId) {
      return NextResponse.json({ error: 'Course is required' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, year: true, period: true, tutorId: true, createdBy: true, programme: { select: { institutionId: true } } },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // SECURITY: Verify the user is authorized for this course (scope + assignment)
    if (!await isUserAuthorizedForCourse(auth.user, course)) {
      return NextResponse.json(
        { error: 'You are not authorized to upload to this course' },
        { status: 403 }
      );
    }

    const test = await prisma.test.create({
      data: {
        title,
        description: description || null,
        embedUrl: embedUrl || '',
        formUrl: formUrl || embedUrl || '',
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore ? parseInt(String(maxScore)) : null,
        fileUrl: fileUrl || null,
        contentType: contentType || 'google_form',
        courseId,
        createdBy: userId,
        isPublished: true,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error('[tests POST] Error:', error);
    return NextResponse.json(
        { error: 'Failed to create test' },
        { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAuth(['TUTOR', 'LECTURER', 'ADMIN', 'SUPER_ADMIN']);
    const body = await req.json();

    const {
      id,
      title,
      description,
      embedUrl,
      formUrl,
      dueDate,
      maxScore,
      fileUrl,
      contentType,
      isPublished,
      courseId,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    const test = await prisma.test.update({
      where: { id },
      data: {
        title,
        description,
        embedUrl,
        formUrl,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore ? parseInt(String(maxScore)) : null,
        fileUrl: fileUrl || null,
        contentType: contentType || 'google_form',
        isPublished,
        courseId,
      },
    });

    return NextResponse.json(test);
  } catch (error: any) {
    console.error('[tests PUT] Error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json(
        { error: 'Failed to update test' },
        { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(['TUTOR', 'LECTURER', 'ADMIN', 'SUPER_ADMIN']);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    await prisma.test.delete({ where: { id } });

    return NextResponse.json({ message: 'Test deleted successfully' });
  } catch (error: any) {
    console.error('[tests DELETE] Error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json(
        { error: 'Failed to delete test' },
        { status: 500 }
    );
  }
}