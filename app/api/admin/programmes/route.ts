// app/api/admin/programmes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — list programmes by university or institution (authenticated users)
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const universityId = searchParams.get('universityId');
    const institutionId = searchParams.get('institutionId');

    const where: any = {};
    if (universityId) where.universityId = universityId;
    if (institutionId) where.institutionId = institutionId;

    const programmes = await prisma.programme.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        institution: { select: { id: true, name: true, slug: true } },
        faculty: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ data: programmes, count: programmes.length });
  } catch (error) {
    console.error('[admin/programmes GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programmes', data: [], count: 0 },
      { status: 500 }
    );
  }
}

// POST — create a programme (admin only)
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(['ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, shortName, code, universityId, institutionId, facultyId } = body;

    if (!name || (!universityId && !institutionId)) {
      return NextResponse.json(
        { error: 'Name and (universityId or institutionId) are required' },
        { status: 400 }
      );
    }

    const programme = await prisma.programme.create({
      data: {
        name,
        shortName: shortName || null,
        code: code || null,
        universityId: universityId || null,
        institutionId: institutionId || null,
        facultyId: facultyId || null,
      },
    });

    return NextResponse.json(programme, { status: 201 });
  } catch (error: any) {
    console.error('[admin/programmes POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create programme' },
      { status: 500 }
    );
  }
}
