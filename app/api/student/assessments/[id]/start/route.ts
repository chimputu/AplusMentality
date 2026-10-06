// app/api/student/assessments/[id]/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeAttemptPolicy } from '@/lib/attempt-policy';

// POST — start or resume an assessment attempt
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(['STUDENT']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get student's profile
    const student = await prisma.user.findUnique({
      where: { clerkId: auth.userId },
    });

    if (!student) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get assessment
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: 'asc' } },
        attempts: {
          where: { userId: student.id },
          orderBy: { startedAt: 'desc' },
        },
        overrides: {
          where: { userId: student.id },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    if (assessment.mode !== 'NATIVE') {
      return NextResponse.json(
        { error: 'This assessment is a Google Form. Open it directly.' },
        { status: 400 }
      );
    }

    if (!assessment.isPublished) {
      return NextResponse.json(
        { error: 'This assessment is not published yet.' },
        { status: 403 }
      );
    }

    // Check if assessment is open
    const now = new Date();
    if (assessment.openAt && now < assessment.openAt) {
      return NextResponse.json(
        { error: 'This assessment has not opened yet.' },
        { status: 403 }
      );
    }

    if (assessment.closeAt && now > assessment.closeAt) {
      return NextResponse.json(
        { error: 'This assessment has closed.' },
        { status: 403 }
      );
    }

    // Check attempt policy
    const policy = computeAttemptPolicy({
      attempts: assessment.attempts.map(a => ({
        id: a.id,
        attemptNumber: a.attemptNumber,
        submittedAt: a.submittedAt,
        score: a.score,
        startedAt: a.startedAt,
      })),
      attemptsMax: assessment.attemptsMax,
      cooldownHrs: assessment.attemptCooldownHrs,
      override: assessment.overrides[0] || null,
      now,
    });

    if (!policy.canStart) {
      return NextResponse.json(
        { error: policy.reason, policy },
        { status: 403 }
      );
    }

    // Check for existing unsubmitted attempt
    const activeAttempt = assessment.attempts.find(
      a => !a.submittedAt
    );

    if (activeAttempt) {
      // Resume existing attempt
      return NextResponse.json({
        attempt: activeAttempt,
        assessment,
        policy,
      });
    }

    // Create new attempt
    const attemptNumber = assessment.attempts.length + 1;

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId: id,
        userId: student.id,
        attemptNumber,
      },
    });

    // Prepare questions (shuffle if needed)
    let questions = assessment.questions;
    if (assessment.shuffleQs) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    return NextResponse.json({
      attempt,
      assessment: {
        ...assessment,
        questions,
      },
      policy,
    });
  } catch (error: any) {
    console.error('[student/assessments/[id]/start POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to start assessment' },
      { status: 500 }
    );
  }
}
