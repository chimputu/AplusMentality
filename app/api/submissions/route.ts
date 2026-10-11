// app/api/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SubmissionStatus } from '@/generated/prisma/enums';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'ALL';
    const status = searchParams.get('status') || 'ALL';

    // Build status filter
    const statusFilter =
      status === 'ALL'
        ? undefined
        : ({ status: status as SubmissionStatus } as const);

    // Fetch all three types of submissions in parallel
    const [quizSubs, testSubs, assignmentSubs] = await Promise.all([
      // Quiz submissions
      (type === 'ALL' || type === 'QUIZ')
        ? prisma.quizSubmission.findMany({
            where: statusFilter,
            include: {
              quiz: { select: { title: true, id: true } },
              user: {
                select: {
                  name: true,
                  email: true,
                  clerkId: true,
                  imageUrl: true,
                },
              },
            },
            orderBy: { submittedAt: 'desc' },
          })
        : Promise.resolve([]),

      // Test submissions
      (type === 'ALL' || type === 'TEST')
        ? prisma.testSubmission.findMany({
            where: statusFilter,
            include: {
              test: { select: { title: true, id: true } },
              user: {
                select: {
                  name: true,
                  email: true,
                  clerkId: true,
                  imageUrl: true,
                },
              },
            },
            orderBy: { submittedAt: 'desc' },
          })
        : Promise.resolve([]),

      // Assignment submissions
      (type === 'ALL' || type === 'ASSIGNMENT')
        ? prisma.assignmentSubmission.findMany({
            where: statusFilter,
            include: {
              assignment: { select: { title: true, id: true, maxScore: true } },
              user: {
                select: {
                  name: true,
                  email: true,
                  clerkId: true,
                  imageUrl: true,
                },
              },
            },
            orderBy: { submittedAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    // Normalize all submissions into a unified format
    const allSubmissions = [
      ...quizSubs.map((s) => ({
        id: s.id,
        type: 'QUIZ' as const,
        formTitle: s.quiz.title,
        formId: s.quiz.id,
        userId: s.userId,
        user: s.user,
        score: s.score,
        total: s.total,
        feedback: s.feedback,
        status: s.status,
        submittedAt: s.submittedAt.toISOString(),
        gradedAt: s.gradedAt?.toISOString() || null,
        fileUrl: null as string | null,
        responseId: s.responseId,
      })),
      ...testSubs.map((s) => ({
        id: s.id,
        type: 'TEST' as const,
        formTitle: s.test.title,
        formId: s.test.id,
        userId: s.userId,
        user: s.user,
        score: s.score,
        total: s.total,
        feedback: s.feedback,
        status: s.status,
        submittedAt: s.submittedAt.toISOString(),
        gradedAt: s.gradedAt?.toISOString() || null,
        fileUrl: null as string | null,
        responseId: s.responseId,
      })),
      ...assignmentSubs.map((s) => ({
        id: s.id,
        type: 'ASSIGNMENT' as const,
        formTitle: s.assignment.title,
        formId: s.assignment.id,
        userId: s.userId,
        user: s.user,
        score: s.score,
        total: s.total,
        feedback: s.feedback,
        status: s.status,
        submittedAt: s.submittedAt.toISOString(),
        gradedAt: s.gradedAt?.toISOString() || null,
        fileUrl: s.fileUrl,
        responseId: s.responseId,
      })),
    ];

    // Sort by submittedAt descending
    allSubmissions.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    // Compute stats
    const stats = {
      total: allSubmissions.length,
      graded: allSubmissions.filter((s) => s.status === 'GRADED').length,
      pending: allSubmissions.filter((s) => s.status === 'PENDING').length,
      returned: allSubmissions.filter((s) => s.status === 'RETURNED').length,
      byType: {
        quiz: quizSubs.length,
        test: testSubs.length,
        assignment: assignmentSubs.length,
      },
    };

    return NextResponse.json({ submissions: allSubmissions, stats });
  } catch (error) {
    console.error('[submissions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
