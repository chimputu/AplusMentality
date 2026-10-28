import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET — list academic levels for dropdown (public — used by onboarding)
export async function GET(req: NextRequest) {
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
        order: true,
        institutionId: true,
      },
      orderBy: { order: 'asc' },
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
