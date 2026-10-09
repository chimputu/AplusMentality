import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placement = searchParams.get('placement') as 'HOMEPAGE' | 'DASHBOARD' | null;
    const institutionId = searchParams.get('institutionId') || null;

    if (!placement) {
      return NextResponse.json(
        { error: 'placement query parameter is required' },
        { status: 400 }
      );
    }

    const now = new Date();

    const where: any = {
      AND: [
        { isActive: true },
        { startsAt: { lte: now } },
        {
          endsAt: {
            or: [
              { equals: null },
              { gte: now },
            ],
          },
        },
        {
          OR: [
            { placement },
            { placement: 'BOTH' },
          ],
        },
      ],
    };

    // Scope-based filtering
    if (institutionId) {
      // Logged-in user — show GLOBAL, ALL, and SPECIFIC matching their institution
      where.AND.push({
        OR: [
          { scope: 'GLOBAL' },
          { scope: 'ALL' },
          {
            scope: 'SPECIFIC',
            targets: { some: { institutionId } },
          },
        ],
      });
    } else {
      // Logged-out user — show only GLOBAL banners
      where.AND.push({ scope: 'GLOBAL' });
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { startsAt: 'desc' }],
      include: {
        institution: {
          select: {
            id: true,
            name: true,
          },
        },
        targets: {
          include: {
            institution: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const result = banners.map((b) => ({
      id: b.id,
      title: b.title,
      message: b.message,
      ctaLabel: b.ctaLabel,
      ctaUrl: b.ctaUrl,
      imageUrl: b.imageUrl,
      variant: b.variant,
      placement: b.placement,
      scope: b.scope,
      priority: b.priority,
      institution: b.institution,
      targets: b.targets.map((t) => t.institution),
    }));

    return NextResponse.json({ banners: result });
  } catch (error) {
    console.error('Error fetching active banners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}
