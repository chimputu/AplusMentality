import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Submit a quiz
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await requireAuth(['STUDENT']);
    const { id } = params;
    const body = await req.json();
    const { score, total, responseId } = body;

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
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}