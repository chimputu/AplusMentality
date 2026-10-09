import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — list faculties for dropdown (admin only)
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

    const faculties = await prisma.faculty.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        institutionId: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: faculties, count: faculties.length });
  } catch (err) {
    console.error('[admin/faculties GET] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch faculties', data: [], count: 0 },
      { status: 500 }
    );
  }
}
