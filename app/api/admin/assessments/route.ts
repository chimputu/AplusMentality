// app/api/admin/assessments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — list all assessments (admin only)
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(['ADMIN', 'SUPER_ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const mode = searchParams.get('mode');
    const courseId = searchParams.get('courseId');

    const where: any = {};
    if (type) where.type = type;
    if (mode) where.mode = mode;
    if (courseId) where.courseId = courseId;

    const assessments = await prisma.assessment.findMany({
      where,
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
            attempts: true,
            formResponses: true,
            questions: true,
          },
        },
      },
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error('[admin/assessments GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

// POST — create a new assessment (admin only)
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(['ADMIN', 'SUPER_ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const {
      title,
      description,
      type,
      mode,
      courseId,
      embedUrl,
      formUrl,
      fileUrl,
      contentType,
      timeLimit,
      openAt,
      closeAt,
      maxGrade,
      passingScore,
      attemptsMax,
      attemptCooldownHrs,
      keepBestScore,
      shuffleQs,
      showAnswersAfter,
      proctored,
      maxTabSwitches,
      requireFullscreen,
      disableCopyPaste,
      requireCamera,
      dueDate,
      isPublished,
      questions,
    } = body;

    if (!title || !type || !mode || !courseId) {
      return NextResponse.json(
        { error: 'Title, type, mode, and courseId are required' },
        { status: 400 }
      );
    }

    const assessment = await prisma.assessment.create({
      data: {
        title,
        description,
        type,
        mode,
        courseId,
        embedUrl,
        formUrl,
        fileUrl,
        contentType,
        timeLimit,
        openAt: openAt ? new Date(openAt) : null,
        closeAt: closeAt ? new Date(closeAt) : null,
        maxGrade: maxGrade ?? 100,
        passingScore: passingScore ?? 50,
        attemptsMax: attemptsMax ?? 1,
        attemptCooldownHrs: attemptCooldownHrs ?? 0,
        keepBestScore: keepBestScore ?? true,
        shuffleQs: shuffleQs ?? false,
        showAnswersAfter: showAnswersAfter ?? 'IMMEDIATELY',
        proctored: proctored ?? false,
        maxTabSwitches: maxTabSwitches ?? 3,
        requireFullscreen: requireFullscreen ?? false,
        disableCopyPaste: disableCopyPaste ?? true,
        requireCamera: requireCamera ?? false,
        dueDate: dueDate ? new Date(dueDate) : null,
        isPublished: isPublished ?? false,
        createdBy: auth.userId,
        questions: questions && questions.length > 0 ? {
          create: questions.map((q: any, index: number) => ({
            order: q.order ?? index + 1,
            type: q.type,
            prompt: q.prompt,
            imageUrl: q.imageUrl,
            options: q.options,
            correctId: q.correctId,
            correctText: q.correctText,
            points: q.points ?? 1,
            explanation: q.explanation,
          })),
        } : undefined,
      },
      include: {
        questions: { orderBy: { order: 'asc' } },
        course: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error: any) {
    console.error('[admin/assessments POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create assessment' },
      { status: 500 }
    );
  }
}
