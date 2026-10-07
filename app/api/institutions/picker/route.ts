import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const institutions = await prisma.institution.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        shortName: true,
        type: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ institutions });
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutions' },
      { status: 500 }
    );
  }
}
