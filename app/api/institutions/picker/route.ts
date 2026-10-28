import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const institutions = await prisma.institution.findMany({
      where: {
        isActive: true,
        type: 'UNIVERSITY',
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        type: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: institutions, count: institutions.length });
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutions', data: [], count: 0 },
      { status: 500 }
    );
  }
}
