// app/api/tests/submissions/[submissionId]/grade/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const auth = await getAuthUser(['ADMIN']);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { submissionId } = await params;
    const body = await req.json();
    const { score, total, feedback } = body;

    if (score === undefined || score === null || score === '') {
      return NextResponse.json({ error: 'Score is required' }, { status: 400 });
    }

    const submission = await prisma.testSubmission.update({
      where: { id: submissionId },
      data: {
        score: parseInt(String(score), 10),
        total: total ? parseInt(String(total), 10) : undefined,
        feedback: feedback ?? null,
        status: 'GRADED',
        gradedAt: new Date(),
        gradedBy: auth.userId,
      },
    });

    return NextResponse.json(submission);
  } catch (error: any) {
    console.error('[test-grade] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to grade' },
      { status: 500 }
    );
  }
}