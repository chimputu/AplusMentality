// app/api/admin/universities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Map Institution periodType to academic system string
function mapPeriodTypeToAcademicSystem(periodType: string | null): string {
  if (!periodType) return 'SEMESTERLY';
  switch (periodType) {
    case 'SEMESTER':
      return 'SEMESTERLY';
    case 'TERM':
      return 'TRIMESTERLY';
    case 'QUARTER':
      return 'QUARTERLY';
    default:
      return 'SEMESTERLY';
  }
}

// GET — list universities with programmes (authenticated users)
// Returns ONLY Institution model records (type=UNIVERSITY) — the single source of truth.
// The legacy University model is no longer used to avoid data pollution.
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch ONLY Institution model records where type is UNIVERSITY
    const institutions = await prisma.university.findMany({
      where: {
        type: 'UNIVERSITY',
        isActive: true,
      },
      include: {
        programmes: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Normalize Institution records to match the expected interface shape
    const universities = institutions.map((inst) => ({
      id: inst.id,
      name: inst.name,
      code: inst.slug || inst.shortName || inst.id,
      academicSystem: mapPeriodTypeToAcademicSystem(inst.periodType),
      programmes: inst.programmes,
    }));

    return NextResponse.json({ data: universities, count: universities.length });
  } catch (error) {
    console.error('[admin/universities GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch universities', data: [], count: 0 },
      { status: 500 }
    );
  }
}

// POST — create a university (admin only)
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(['ADMIN', 'SUPER_ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, code, academicSystem } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    const periodType = academicSystem === 'TRIMESTERLY' ? 'TERM' : academicSystem === 'QUARTERLY' ? 'QUARTER' : 'SEMESTER';
    const university = await prisma.university.create({
      data: {
        name,
        slug: code,
        periodType,
      },
    });

    return NextResponse.json(university, { status: 201 });
  } catch (error: any) {
    console.error('[admin/universities POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create university' },
      { status: 500 }
    );
  }
}
