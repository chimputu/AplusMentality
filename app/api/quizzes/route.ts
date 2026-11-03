import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { isUserAuthorizedForCourse, buildCourseResourceScopeWhereFromUser } from '@/lib/auth/scope';
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

    const where: any = {};

    // SECURITY: Scope quiz results by user role
    const role = auth.role;
    const user = auth.user;

    if (role === 'SUPER_ADMIN') {
      // SUPER_ADMIN can see all quizzes
    } else if (role === 'ADMIN') {
      // ADMIN scoped to their institution
      if (user.institutionId) {
        where.course = {
          programme: {
            institutionId: user.institutionId,
          },
        };
      }
    } else if (role === 'TUTOR' || role === 'LECTURER') {
      // TUTOR/LECTURER can only see quizzes they created
      where.createdBy = user.clerkId;
    } else {
      // STUDENT: only see published quizzes for their own institution/year/period
      where.isPublished = true;
      where.isPreview = false;
      const scopeWhere = buildCourseResourceScopeWhereFromUser(user);
      if (scopeWhere.course) {
        where.course = { ...where.course, ...scopeWhere.course };
      }
    }

    if (courseId) where.courseId = courseId;

    // SECURITY: Do not expose all students' submissions to non-admin users.
    // Only admins/tutors/lecturers may see submission counts; students see only their own.
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    const isTutorOrLecturer = role === 'TUTOR' || role === 'LECTURER';

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        creator: {
          select: { name: true },
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
        // Only admins and tutors/lecturers get submission counts (not full submission data)
        _count: isAdmin || isTutorOrLecturer ? { select: { submissions: true } } : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform response: replace _count with submissionCount for cleaner API
    const safeQuizzes = quizzes.map((q: any) => ({
      ...q,
      submissionCount: q._count?.submissions ?? 0,
      _count: undefined,
    }));

    return NextResponse.json(safeQuizzes);
  } catch (error) {
    console.error('[quizzes GET] Error:', error);
    return NextResponse.json(
        { error: 'Failed to fetch quizzes' },
        { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(['TUTOR', 'LECTURER', 'ADMIN']);
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
        { error: 'You are not authorized to create quizzes for this course' },
        { status: 403 }
      );
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description: description || null,
        embedUrl: embedUrl || '',
        formUrl: formUrl || embedUrl || '',
        dueDate: dueDate ? new Date(dueDate) : null,
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

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error('[quizzes POST] Error:', error);
    return NextResponse.json(
        { error: 'Failed to create quiz' },
        { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser(['TUTOR', 'LECTURER', 'ADMIN', 'SUPER_ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    // Re-fetch with correct ID from body
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { course: { select: { programme: { select: { institutionId: true } } } } },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // SECURITY: Verify ownership — only creator or admin can update
    if (auth.user.role !== 'ADMIN' && auth.user.role !== 'SUPER_ADMIN') {
      if (quiz.createdBy !== auth.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // SECURITY: If changing courseId, verify the new course is within scope
    const { courseId } = body;
    if (courseId && courseId !== quiz.courseId) {
      const newCourse = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, tutorId: true, createdBy: true, programme: { select: { institutionId: true } } },
      });
      if (!newCourse) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
      if (!await isUserAuthorizedForCourse(auth.user, newCourse)) {
        return NextResponse.json(
          { error: 'You are not authorized to move this quiz to the selected course' },
          { status: 403 }
        );
      }
    }

    // SECURITY: Mass assignment protection — only accept explicit fields
    const updated = await prisma.quiz.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description ?? null }),
        ...(body.embedUrl !== undefined && { embedUrl: body.embedUrl }),
        ...(body.formUrl !== undefined && { formUrl: body.formUrl }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        ...(body.fileUrl !== undefined && { fileUrl: body.fileUrl ?? null }),
        ...(body.contentType !== undefined && { contentType: body.contentType }),
        ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
        ...(courseId !== undefined && { courseId }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[quizzes PUT] Error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json(
        { error: 'Failed to update quiz' },
        { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthUser(['TUTOR', 'LECTURER', 'ADMIN', 'SUPER_ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    // SECURITY: Verify ownership before deletion
    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (auth.user.role !== 'ADMIN' && auth.user.role !== 'SUPER_ADMIN') {
      if (quiz.createdBy !== auth.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await prisma.quiz.delete({ where: { id } });

    return NextResponse.json({ message: 'Quiz deleted successfully' });
  } catch (error: any) {
    console.error('[quizzes DELETE] Error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json(
        { error: 'Failed to delete quiz' },
        { status: 500 }
    );
  }
}