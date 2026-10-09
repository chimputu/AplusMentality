import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — list academic levels for dropdown (admin only)
export async function GET(req: NextRequest) {
  const admin = await getAuthUser(['ADMIN']);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', data: [], count: 0 }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get('institutionId');

    const where: any = {};
    if (institutionId) where.institutionId = institutionId;

    const levels = await prisma.academicLevel.findMany({
      where,
      select: {
        id: true,
        name: true,
        levelNumber: true,
        institutionId: true,
      },
      orderBy: { levelNumber: 'asc' },
    });

    return NextResponse.json({ data: levels, count: levels.length });
  } catch (err) {
    console.error('[admin/levels GET] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch levels', data: [], count: 0 },
      { status: 500 }
    );
  }
}
