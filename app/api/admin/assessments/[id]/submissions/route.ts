// app/api/admin/assessments/[id]/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — list submissions for an assessment (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(['ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'ALL' | 'PENDING' | 'GRADED'

    const assessment = await prisma.assessment.findUnique({ where: { id } });
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    let submissions: any[] = [];

    if (assessment.mode === 'NATIVE') {
      const where: any = { assessmentId: id };
      if (filter === 'PENDING') where.score = null;
      if (filter === 'GRADED') where.score = { not: null };

      submissions = await prisma.assessmentAttempt.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              clerkId: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
            },
          },
        },
      });
    } else {
      // GOOGLE_FORM mode
      const where: any = { assessmentId: id };
      if (filter === 'PENDING') where.status = 'PENDING';
      if (filter === 'GRADED') where.score = { not: null };

      submissions = await prisma.formResponse.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              clerkId: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
            },
          },
        },
      });
    }

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('[admin/assessments/[id]/submissions GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// PUT — grade a submission (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(['ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { submissionId, score, total, feedback, mode } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    let updated;

    if (mode === 'NATIVE') {
      const assessment = await prisma.assessment.findUnique({ where: { id } });
      updated = await prisma.assessmentAttempt.update({
        where: { id: submissionId },
        data: {
          score,
          totalPoints: total,
          percentage: total ? Math.round((score / total) * 100) : null,
          passed: total ? Math.round((score / total) * 100) >= (assessment?.passingScore ?? 50) : null,
          feedback,
          gradedAt: new Date(),
          gradedBy: auth.userId,
        },
      });
    } else {
      updated = await prisma.formResponse.update({
        where: { id: submissionId },
        data: {
          score,
          total,
          feedback,
          status: 'GRADED',
          gradedAt: new Date(),
          gradedBy: auth.userId,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[admin/assessments/[id]/submissions PUT] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to grade submission' },
      { status: 500 }
    );
  }
}
