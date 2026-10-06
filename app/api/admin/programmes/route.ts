// app/api/admin/programmes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — list programmes by university (authenticated users)
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const universityId = searchParams.get('universityId');

    if (!universityId) {
      return NextResponse.json(
        { error: 'universityId query parameter is required' },
        { status: 400 }
      );
    }

    const programmes = await prisma.programme.findMany({
      where: { universityId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(programmes);
  } catch (error) {
    console.error('[admin/programmes GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programmes' },
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
    const { name, shortName, universityId } = body;

    if (!name || !universityId) {
      return NextResponse.json(
        { error: 'Name and universityId are required' },
        { status: 400 }
      );
    }

    const programme = await prisma.programme.create({
      data: {
        name,
        shortName: shortName || null,
        universityId,
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
