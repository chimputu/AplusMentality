import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAuthUser } from '@/lib/auth';
import { isUserAuthorizedForCourse } from '@/lib/auth/scope';
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
        programme: { institutionId: universityId },
      };
    }

    const assignments = await prisma.assignment.findMany({
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

    return NextResponse.json(assignments);
  } catch (error: any) {
    console.error('[assignments GET] Error:', error);
    console.error('[assignments GET] Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n'),
    });
    return NextResponse.json(
        {
          error: 'Failed to fetch assignments',
          details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        },
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
        { error: 'You are not authorized to create assignments for this course' },
        { status: 403 }
      );
    }

    const assignment = await prisma.assignment.create({
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

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('[assignments POST] Error:', error);
    return NextResponse.json(
        { error: 'Failed to create assignment' },
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
      maxScore,
      fileUrl,
      contentType,
      isPublished,
      courseId,
    } = body;

    if (!id) {
      return NextResponse.json(
          { error: 'Assignment ID is required' },
          { status: 400 }
      );
    }

    const assignment = await prisma.assignment.update({
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

    return NextResponse.json(assignment);
  } catch (error: any) {
    console.error('[assignments PUT] Error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
          { error: 'Assignment not found' },
          { status: 404 }
      );
    }

    return NextResponse.json(
        { error: 'Failed to update assignment' },
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
      return NextResponse.json(
          { error: 'Assignment ID is required' },
          { status: 400 }
      );
    }

    await prisma.assignment.delete({ where: { id } });

    return NextResponse.json({ message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error('[assignments DELETE] Error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
          { error: 'Assignment not found' },
          { status: 404 }
      );
    }

    return NextResponse.json(
        { error: 'Failed to delete assignment' },
        { status: 500 }
    );
  }
}