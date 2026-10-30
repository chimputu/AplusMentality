import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAuthUser } from '@/lib/auth';
import { isResourceInFullScopeFromUser } from '@/lib/auth/scope';
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
        programme: {
          institutionId,
        },
      };
    } else if (universityId) {
      where.course = {
        universityId,
      };
    }

    const quizzes = await prisma.quiz.findMany({
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
            university: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
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

    return NextResponse.json(quizzes);
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
      select: { id: true, universityId: true, year: true, period: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // SECURITY: Verify the tutor's scope matches the target course
    if (!isResourceInFullScopeFromUser(auth.user, course)) {
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
    const auth = await getAuthUser(['TUTOR', 'LECTURER', 'ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();

    const {
      id,
      title,
      description,
      embedUrl,
      formUrl,
      dueDate,
      fileUrl,
      contentType,
      isPublished,
      courseId,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        title,
        description,
        embedUrl,
        formUrl,
        dueDate: dueDate ? new Date(dueDate) : null,
        fileUrl: fileUrl || null,
        contentType: contentType || 'google_form',
        isPublished,
        courseId,
      },
    });

    return NextResponse.json(quiz);
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
    const auth = await getAuthUser(['TUTOR', 'LECTURER', 'ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
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