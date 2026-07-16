import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Submit a quiz
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(['STUDENT']);
    const { id } = await params;
    const body = await req.json();
    const { score, total, responseId } = body;

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Check if already submitted
    const existingSubmission = await prisma.quizSubmission.findFirst({
      where: {
        quizId: id,
        userId,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted this quiz' },
        { status: 400 }
      );
    }

    const submission = await prisma.quizSubmission.create({
      data: {
        quizId: id,
        userId,
        score: score || null,
        total: total || null,
        responseId: responseId || null,
        status: 'PENDING',
        submittedAt: new Date(),
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}