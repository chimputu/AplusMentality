// app/api/assignments/submissions/[submissionId]/grade/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const authResult: any = await requireAuth(['ADMIN']);
    const adminId = authResult?.userId ?? authResult?.clerkId ?? authResult?.id;

    if (!adminId) {
      return NextResponse.json({ error: 'Admin auth failed' }, { status: 401 });
    }

    const { submissionId } = await params;
    const body = await req.json();
    const { score, total, feedback, status } = body;

    if (score === undefined || score === null || score === '') {
      return NextResponse.json({ error: 'Score is required' }, { status: 400 });
    }

    const submission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: parseInt(String(score), 10),
        total: total ? parseInt(String(total), 10) : undefined,
        feedback: feedback ?? null,
        status: status ?? 'GRADED',
        gradedAt: new Date(),
        gradedBy: adminId,
      },
    });

    return NextResponse.json(submission);
  } catch (error: any) {
    console.error('[grade] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to grade submission' },
      { status: 500 }
    );
  }
}