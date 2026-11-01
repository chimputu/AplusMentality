// app/api/assignments/[id]/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface SubmissionDto {
  id: string;
  score: number | null;
  status: string;
  submittedAt: string | null;
  userName: string | null;
  fileUrl: string | null;
  userEmail?: string | null;
}

interface AssignmentSubmissionsDto {
  assignmentId: string;
  assignmentTitle: string;
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

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        course: { select: { programme: { select: { institutionId: true } } } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // SECURITY: Institution scoping
    const assignmentInstitutionId = assignment.course?.programme?.institutionId;
    if (auth.role !== 'SUPER_ADMIN') {
      if (assignmentInstitutionId && auth.user.institutionId && assignmentInstitutionId !== auth.user.institutionId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (!assignmentInstitutionId && auth.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: id },
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

    const dto: AssignmentSubmissionsDto = {
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      submissions: submissions.map((s) => ({
        id: s.id,
        score: s.score,
        status: s.status,
        submittedAt: s.submittedAt?.toISOString() ?? null,
        userName: s.user?.name ?? null,
        fileUrl: s.fileUrl,
        userEmail: (auth.role === 'ADMIN' || auth.role === 'SUPER_ADMIN')
          ? (s.user as { email?: string | null } | null)?.email ?? null
          : undefined,
      })),
    };

    return NextResponse.json(dto);
  } catch (error) {
    console.error('[submissions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}