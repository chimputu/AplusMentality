// API route for syncing offline assessment answers
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Maximum length for text answers
const MAX_TEXT_ANSWER_LENGTH = 10000;

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { attemptId, questionId, selectedOptionId, textAnswer, numericAnswer, matchingAnswer } = body;

    if (!attemptId || !questionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // SECURITY: Validate text answer length
    if (textAnswer !== undefined && textAnswer !== null && textAnswer.length > MAX_TEXT_ANSWER_LENGTH) {
      return NextResponse.json({ error: 'Answer too long' }, { status: 400 });
    }

    // SECURITY: Verify attempt ownership and check if attempt is still editable
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      select: { userId: true, assessmentId: true, submittedAt: true, autoSubmitted: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // SECURITY: Reject writes after attempt is submitted/locked
    if (attempt.submittedAt || attempt.autoSubmitted) {
      return NextResponse.json(
        { error: 'This attempt has already been submitted' },
        { status: 409 }
      );
    }

    // SECURITY: Verify questionId belongs to the assessment associated with attemptId
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { assessmentId: true },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check if question is directly attached to the attempt's assessment
    // or is part of it via AssessmentItem
    const questionBelongsToAssessment = question.assessmentId === attempt.assessmentId ||
      (await prisma.assessmentItem.count({
        where: {
          assessmentId: attempt.assessmentId,
          questionId,
        },
      })) > 0;

    if (!questionBelongsToAssessment) {
      return NextResponse.json(
        { error: 'This question does not belong to this assessment' },
        { status: 403 }
      );
    }

    // SECURITY: Ignore client-supplied scores — only the grader sets scores
    // The client cannot set isCorrect, pointsEarned, or feedback

    // Upsert the answer (idempotent for offline sync)
    await prisma.answer.upsert({
      where: {
        attemptId_questionId: { attemptId, questionId },
      },
      update: {
        selectedOptionId,
        textAnswer,
        numericAnswer,
        matchingAnswer,
        updatedAt: new Date(),
      },
      create: {
        attemptId,
        questionId,
        selectedOptionId,
        textAnswer,
        numericAnswer,
        matchingAnswer,
        answeredAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[attempt answer] Error:', error);
    return NextResponse.json({ error: 'Failed to sync answer' }, { status: 500 });
  }
}
