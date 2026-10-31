// app/api/quizzes/[id]/submissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
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
        submissions: {
          include: {
            user: {
              select: {
                name: true,
                // SECURITY: Do not expose email or clerkId to non-admin users
                ...(auth.role === 'ADMIN' || auth.role === 'SUPER_ADMIN' ? {
                  email: true,
                } : {}),
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    return NextResponse.json(quiz);
  } catch (error) {
    console.error('[quiz-submissions] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}