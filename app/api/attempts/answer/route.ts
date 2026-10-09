// API route for syncing offline assessment answers
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { attemptId, questionId, selectedOptionId, textAnswer, numericAnswer, matchingAnswer } = body;

    if (!attemptId || !questionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify attempt ownership
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      select: { userId: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user || attempt.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Upsert the answer
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
    console.error('Error syncing answer:', error);
    return NextResponse.json({ error: 'Failed to sync answer' }, { status: 500 });
  }
}
