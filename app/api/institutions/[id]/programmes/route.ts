// Fetch programmes for a specific institution
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const programmes = await prisma.programme.findMany({
      where: { institutionId: id },
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
    console.error('[institutions/[id]/programmes GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programmes' },
      { status: 500 }
    );
  }
}
