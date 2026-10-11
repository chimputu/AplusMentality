import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — list academic periods for dropdown (admin only)
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

    const periods = await prisma.academicPeriod.findMany({
      where,
      select: {
        id: true,
        name: true,
        order: true,
        institutionId: true,
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ data: periods, count: periods.length });
  } catch (err) {
    console.error('[admin/periods GET] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch periods', data: [], count: 0 },
      { status: 500 }
    );
  }
}
