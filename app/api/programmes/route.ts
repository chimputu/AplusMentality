import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const institutionId =
        searchParams.get('institutionId') || searchParams.get('institution');

    const universityId =
        searchParams.get('universityId') || searchParams.get('university');

    const where: {
      institutionId?: string;
    } = {};

    if (institutionId) where.institutionId = institutionId;
    if (universityId) where.institutionId = universityId;

    const programmes = await prisma.programme.findMany({
      where,
      select: {
        id: true,
        name: true,
        shortName: true,
        code: true,
        institutionId: true,
        institution: {
          select: {
            id: true,
            name: true,
            slug: true,
            shortName: true,
          },
        },
        facultyId: true,
        faculty: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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