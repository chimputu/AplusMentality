// app/api/student/assessments/[id]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { gradeAssessment } from '@/lib/grade-assessment';

// POST — submit an assessment attempt
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
    const body = await req.json();
    const { attemptId, answers, timeSpent, tabSwitches, fullscreenExits, copyAttempts, violations } = body;

    if (!attemptId) {
      return NextResponse.json(
        { error: 'Attempt ID is required' },
        { status: 400 }
      );
    }

    // Get student's profile
    const student = await prisma.user.findUnique({
      where: { clerkId: auth.userId },
    });

    if (!student) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get attempt
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.userId !== student.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (attempt.submittedAt) {
      return NextResponse.json(
        { error: 'This attempt has already been submitted.' },
        { status: 400 }
      );
    }

    // Get assessment with questions
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: 'asc' } },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Grade the attempt
    const gradeResult = gradeAssessment({
      questions: assessment.questions,
      answers: answers || [],
      passingScore: assessment.passingScore,
    });

    // Update attempt
    const updatedAttempt = await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        answers,
        submittedAt: new Date(),
        timeSpent,
        tabSwitches: tabSwitches ?? 0,
        fullscreenExits: fullscreenExits ?? 0,
        copyAttempts: copyAttempts ?? 0,
        violations,
        score: gradeResult.needsManualGrading ? null : gradeResult.score,
        totalPoints: gradeResult.totalPoints,
        percentage: gradeResult.needsManualGrading ? null : gradeResult.percentage,
        passed: gradeResult.needsManualGrading ? null : gradeResult.passed,
        gradedAt: gradeResult.needsManualGrading ? null : new Date(),
      },
    });

    // If keepBestScore, update isBest flags
    if (assessment.keepBestScore) {
      // Clear all isBest for this assessment + user
      await prisma.assessmentAttempt.updateMany({
        where: {
          assessmentId: id,
          userId: student.id,
          isBest: true,
        },
        data: { isBest: false },
      });

      // Set this attempt as best if it has a score
      if (gradeResult.score !== null) {
        await prisma.assessmentAttempt.update({
          where: { id: attemptId },
          data: { isBest: true },
        });
      }
    }

    // If Google Form mode, create FormResponse instead
    if (assessment.mode === 'GOOGLE_FORM') {
      const formResponse = await prisma.formResponse.create({
        data: {
          assessmentId: id,
          userId: student.id,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });

      return NextResponse.json({
        attempt: updatedAttempt,
        formResponse,
        grade: gradeResult,
      });
    }

    return NextResponse.json({
      attempt: updatedAttempt,
      grade: gradeResult,
    });
  } catch (error: any) {
    console.error('[student/assessments/[id]/submit POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit assessment' },
      { status: 500 }
    );
  }
}
