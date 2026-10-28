import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET — list branches for dropdown (public — used by onboarding)
export async function GET(req: NextRequest) {
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
