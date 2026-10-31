import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Allowed Cloudinary domains for file URLs
const ALLOWED_FILE_HOSTS = ['res.cloudinary.com'];

function isValidFileUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_FILE_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

// POST - Submit a quiz
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Authenticate via Clerk (API-safe, no redirect)
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Only students can submit quizzes
    if (user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: quizId } = await params;
    const body = await req.json();
    const { responseId, fileUrl } = body;

    // SECURITY: Ignore client-supplied score and total — these must be set by the grader
    // The client must never be trusted to supply scores.

    // Check if quiz exists and is published
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: { select: { universityId: true, id: true } },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (!quiz.isPublished) {
      return NextResponse.json({ error: 'This quiz is not available' }, { status: 403 });
    }

    // SECURITY: Check due date
    if (quiz.dueDate && new Date(quiz.dueDate) < new Date()) {
      return NextResponse.json({ error: 'This quiz has expired' }, { status: 403 });
    }

    // SECURITY: Verify the student is enrolled in the quiz's course
    if (quiz.courseId) {
      const enrollment = await prisma.enrollment.findFirst({
        where: { userId: user.id, courseId: quiz.courseId },
      });
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You are not enrolled in this course' },
          { status: 403 }
        );
      }
    }

    // SECURITY: Validate fileUrl if provided
    if (fileUrl && !isValidFileUrl(fileUrl)) {
      return NextResponse.json(
        { error: 'Invalid file URL' },
        { status: 400 }
      );
    }

    // Check if already submitted (atomic via unique constraint)
    const existingSubmission = await prisma.quizSubmission.findFirst({
      where: { quizId, userId: user.id },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted this quiz' },
        { status: 409 }
      );
    }

    // SECURITY: Score and total are NOT set by the client — they default to null
    // and are set by the grading process only.
    try {
      const submission = await prisma.quizSubmission.create({
        data: {
          quizId,
          userId: user.id,
          responseId: responseId || null,
          fileUrl: fileUrl || null,
          status: 'PENDING',
          submittedAt: new Date(),
        },
      });

      return NextResponse.json(submission, { status: 201 });
    } catch (error: any) {
      // Handle unique constraint violation (concurrent duplicate submission)
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'You have already submitted this quiz' },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('[quiz submit] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}