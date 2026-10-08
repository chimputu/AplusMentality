// Public API for fetching programmes, optionally filtered by institution
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get('institutionId');

    const where: { institutionId?: string } = {};
    if (institutionId) where.institutionId = institutionId;

    const programmes = await prisma.programme.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        institutionId: true,
        facultyId: true,
        faculty: { select: { id: true, name: true, code: true } },
        _count: {
          select: {
            courses: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ programmes });
  } catch (error) {
    console.error('[programmes GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programmes' },
      { status: 500 }
    );
  }
}
