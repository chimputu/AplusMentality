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

    // Build scope filter based on whether user is logged in
    const scopeFilter = institutionId
      ? {
          OR: [
            { scope: 'GLOBAL' },
            { scope: 'ALL' },
            {
              scope: 'SPECIFIC',
              targets: { some: { institutionId } },
            },
          ],
        }
      : {
          // Guest users see GLOBAL and ALL banners, but not SPECIFIC
          OR: [
            { scope: 'GLOBAL' },
            { scope: 'ALL' },
          ],
        };

    const where: any = {
      isActive: true,
      startsAt: { lte: now },
      placement: { in: [placement, 'BOTH'] },
      AND: [
        {
          OR: [
            { endsAt: null },
            { endsAt: { gte: now } },
          ],
        },
        scopeFilter,
      ],
    };

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

    return NextResponse.json({ banners: result, count: result.length });
  } catch (error) {
    console.error('[banners] Error:', error);
    // Never return 500 — return empty banners array so the client doesn't crash
    return NextResponse.json({ banners: [], count: 0 });
  }
}
