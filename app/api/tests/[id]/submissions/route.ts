// app/api/tests/[id]/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface SubmissionDto {
  id: string;
  score: number | null;
  status: string;
  submittedAt: string | null;
  userName: string | null;
  userEmail?: string | null;
}

interface TestSubmissionsDto {
  testId: string;
  testTitle: string;
  submissions: SubmissionDto[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(['ADMIN', 'SUPER_ADMIN']);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        course: { select: { programme: { select: { institutionId: true } } } },
      },
    });

    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    // SECURITY: Institution scoping
    const testInstitutionId = test.course?.programme?.institutionId;
    if (auth.role !== 'SUPER_ADMIN') {
      if (testInstitutionId && auth.user.institutionId && testInstitutionId !== auth.user.institutionId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (!testInstitutionId && auth.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const submissions = await prisma.testSubmission.findMany({
      where: { testId: id },
      include: {
        user: {
          select: {
            name: true,
            ...(auth.role === 'ADMIN' || auth.role === 'SUPER_ADMIN' ? { email: true } : {}),
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const dto: TestSubmissionsDto = {
      testId: test.id,
      testTitle: test.title,
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
    console.error('[test-submissions] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}