import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Submit a test
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(['STUDENT']);
    const { id } = await params;
    const body = await req.json();
    const { score, total, responseId } = body;

    // Check if test exists
    const test = await prisma.test.findUnique({
      where: { id },
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Check if already submitted
    const existingSubmission = await prisma.testSubmission.findFirst({
      where: {
        testId: id,
        userId,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted this test' },
        { status: 400 }
      );
    }

    const submission = await prisma.testSubmission.create({
      data: {
        testId: id,
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
    console.error('Error submitting test:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit test' },
      { status: 500 }
    );
  }
}