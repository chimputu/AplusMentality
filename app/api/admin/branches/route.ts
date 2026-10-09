import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — list branches for dropdown (admin only)
export async function GET(req: NextRequest) {
  const admin = await getAuthUser(['ADMIN']);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized', data: [], count: 0 }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const programmeId = searchParams.get('programmeId');

    const where: any = {};
    if (programmeId) where.programmeId = programmeId;

    const branches = await prisma.branch.findMany({
      where,
      select: {
        id: true,
        name: true,
        programmeId: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: branches, count: branches.length });
  } catch (err) {
    console.error('[admin/branches GET] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch branches', data: [], count: 0 },
      { status: 500 }
    );
  }
}
