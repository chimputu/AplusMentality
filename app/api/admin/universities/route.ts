// app/api/admin/universities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — list universities with programmes (admin only)
export async function GET() {
  try {
    const auth = await getAuthUser(['ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const universities = await prisma.university.findMany({
      include: {
        programmes: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(universities);
  } catch (error) {
    console.error('[admin/universities GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch universities' },
      { status: 500 }
    );
  }
}

// POST — create a university (admin only)
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(['ADMIN']);
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

    const university = await prisma.university.create({
      data: {
        name,
        code,
        academicSystem: academicSystem || 'SEMESTERLY',
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
