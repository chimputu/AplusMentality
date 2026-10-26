import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint for banner configuration.
 * RESTRICTED: Only ADMIN and SUPER_ADMIN can access this endpoint.
 * TODO: Remove this endpoint before production deployment.
 */
export async function GET() {
  // SECURITY: Require authentication and admin role
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
  }

  try {
    const all = await prisma.banner.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
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

    const now = new Date();
    const active = all.filter(
      (b) =>
        b.isActive &&
        b.startsAt <= now &&
        (!b.endsAt || b.endsAt >= now)
    );

    return NextResponse.json({
      total: all.length,
      activeCount: active.length,
      banners: all.map((b) => ({
        id: b.id,
        title: b.title,
        message: b.message,
        isActive: b.isActive,
        placement: b.placement,
        scope: b.scope,
        variant: b.variant,
        startsAt: b.startsAt.toISOString(),
        endsAt: b.endsAt?.toISOString() ?? null,
        priority: b.priority,
        hasImage: !!b.imageUrl,
        imageUrl: b.imageUrl,
        targets: b.targets.map((t) => t.institution),
        createdAt: b.createdAt.toISOString(),
      })),
    });
  } catch (err: any) {
    console.error('[debug/banners] Error:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
