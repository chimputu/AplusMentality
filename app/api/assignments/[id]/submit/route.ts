import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Submit an assignment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(['STUDENT']);
    const { id } = await params;
    const body = await req.json();
    const { fileUrl, responseId } = body;

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Check if already submitted
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId: id,
        userId,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted this assignment' },
        { status: 400 }
      );
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: id,
        userId,
        fileUrl: fileUrl || null,
        responseId: responseId || null,
        status: 'PENDING',
        submittedAt: new Date(),
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit assignment' },
      { status: 500 }
    );
  }
}