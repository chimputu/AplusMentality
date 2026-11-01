// app/api/quizzes/[id]/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Safe DTO for a quiz submission — never returns raw Prisma objects */
interface SubmissionDto {
  id: string;
  score: number | null;
  status: string;
  submittedAt: string | null;
  userName: string | null;
  userEmail?: string | null;
}

/** Safe DTO for the quiz submissions response */
interface QuizSubmissionsDto {
  quizId: string;
  quizTitle: string;
  submissions: SubmissionDto[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Allow ADMIN, TUTOR, LECTURER, SUPER_ADMIN to view submissions
    const auth = await getAuthUser(['ADMIN', 'TUTOR', 'LECTURER', 'SUPER_ADMIN']);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: { select: { programme: { select: { institutionId: true } } } },
      },
    });

    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

    // SECURITY: Institution scoping — non-super-admin users can only access
    // quizzes from their own institution
    const quizInstitutionId = quiz.course?.programme?.institutionId;
    if (auth.role !== 'SUPER_ADMIN') {
      if (quizInstitutionId && auth.user.institutionId && quizInstitutionId !== auth.user.institutionId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // If the quiz has no course/institution and the user is not super-admin, deny access
      if (!quizInstitutionId && auth.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const submissions = await prisma.quizSubmission.findMany({
      where: { quizId: id },
      include: {
        user: {
          select: {
            name: true,
            // SECURITY: Only admins see emails
            ...(auth.role === 'ADMIN' || auth.role === 'SUPER_ADMIN' ? {
              email: true,
            } : {}),
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // SECURITY: Return DTOs instead of raw Prisma objects
    const dto: QuizSubmissionsDto = {
      quizId: quiz.id,
      quizTitle: quiz.title,
      submissions: submissions.map((s) => ({
        id: s.id,
        score: s.score,
        status: s.status,
        submittedAt: s.submittedAt?.toISOString() ?? null,
        userName: s.user?.name ?? null,
        userEmail: (auth.role === 'ADMIN' || auth.role === 'SUPER_ADMIN')
          ? (s.user as { email?: string | null } | null)?.email ?? null
          : undefined,
      })),
    };

    return NextResponse.json(dto);
  } catch (error) {
    console.error('[quiz-submissions] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}