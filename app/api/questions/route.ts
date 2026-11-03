import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — list questions for dropdown (admin only)
export async function GET(req: NextRequest) {
  const admin = await getAuthUser(['ADMIN', 'SUPER_ADMIN']);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', data: [], count: 0 }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const where: any = {};
    if (courseId) where.courseId = courseId;

    const questions = await prisma.question.findMany({
      where,
      select: {
        id: true,
        prompt: true,
        type: true,
        courseId: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: questions, count: questions.length });
  } catch (err) {
    console.error('[questions GET] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch questions', data: [], count: 0 },
      { status: 500 }
    );
  }
}
