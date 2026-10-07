'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { BannerVariant, BannerPlacement, BannerScope } from '../../generated/prisma/client';

// ============================================
// Internal Helpers
// ============================================

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('Admin access required');
  }
  return user;
}

// ============================================
// Schemas
// ============================================

const bannerBaseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  message: z.string().min(3, 'Message must be at least 3 characters'),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().url('Must be a valid URL').or(z.string().startsWith('/')).optional(),
  imageUrl: z.string().optional(),
  variant: z.nativeEnum(BannerVariant),
  placement: z.nativeEnum(BannerPlacement),
  startsAt: z.string().datetime().or(z.date()),
  endsAt: z.string().datetime().or(z.date()).optional().nullable(),
  isActive: z.boolean().default(true),
  priority: z.number().int().default(0),

  // Multi-institution targeting
  scope: z.nativeEnum(BannerScope).default('SPECIFIC'),
  institutionIds: z.array(z.string()).default([]),
});

const createBannerSchema = bannerBaseSchema.refine(
  (data) => data.scope !== 'SPECIFIC' || data.institutionIds.length > 0,
  { message: 'Select at least one institution when scope is SPECIFIC', path: ['institutionIds'] }
);

const updateBannerSchema = bannerBaseSchema.partial();

// ============================================
// Server Actions
// ============================================

export async function listBanners(filters?: {
  institutionId?: string | null;
  placement?: BannerPlacement;
  isActive?: boolean;
  scope?: BannerScope;
}) {
  await requireAdmin();

  const where: any = {};
  if (filters?.institutionId !== undefined) {
    where.institutionId = filters.institutionId;
  }
  if (filters?.placement) {
    where.placement = filters.placement;
  }
  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }
  if (filters?.scope) {
    where.scope = filters.scope;
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

  return banners.map((b) => ({
    ...b,
    startsAt: b.startsAt.toISOString(),
    endsAt: b.endsAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    targets: b.targets.map((t) => ({
      id: t.id,
      institutionId: t.institutionId,
      institution: t.institution,
    })),
  }));
}

export async function getActiveBanners(
  placement: 'HOMEPAGE' | 'DASHBOARD',
  institutionId?: string | null
) {
  const now = new Date();

  const where: any = {
    isActive: true,
    startsAt: { lte: now },
    endsAt: {
      or: [
        { equals: null },
        { gte: now },
      ],
    },
    OR: [
      { placement },
      { placement: 'BOTH' },
    ],
  };

  // Scope-based filtering
  if (institutionId) {
    // Logged-in user — show GLOBAL, ALL, and SPECIFIC matching their institution
    where.AND = [
      {
        OR: [
          { scope: 'GLOBAL' },
          { scope: 'ALL' },
          {
            scope: 'SPECIFIC',
            targets: { some: { institutionId } },
          },
        ],
      },
    ];
  } else {
    // Logged-out user — show only GLOBAL banners
    where.scope = 'GLOBAL';
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

  return banners.map((b) => ({
    id: b.id,
    title: b.title,
    message: b.message,
    ctaLabel: b.ctaLabel,
    ctaUrl: b.ctaUrl,
    imageUrl: b.imageUrl,
    variant: b.variant,
    placement: b.placement,
    scope: b.scope,
    startsAt: b.startsAt.toISOString(),
    endsAt: b.endsAt?.toISOString() ?? null,
    priority: b.priority,
    institution: b.institution,
    targets: b.targets.map((t) => t.institution),
  }));
}

export async function createBanner(rawInput: unknown) {
  const admin = await requireAdmin();

  const input = createBannerSchema.parse(rawInput);

  const startsAt = typeof input.startsAt === 'string' ? new Date(input.startsAt) : input.startsAt;
  const endsAt = input.endsAt
    ? typeof input.endsAt === 'string'
      ? new Date(input.endsAt)
      : input.endsAt
    : null;

  // Determine institutionId for backward compat
  const institutionId =
    input.scope === 'SPECIFIC' && input.institutionIds.length === 1
      ? input.institutionIds[0]
      : null;

  const banner = await prisma.banner.create({
    data: {
      title: input.title,
      message: input.message,
      ctaLabel: input.ctaLabel,
      ctaUrl: input.ctaUrl,
      imageUrl: input.imageUrl,
      variant: input.variant,
      placement: input.placement,
      scope: input.scope,
      startsAt,
      endsAt,
      isActive: input.isActive,
      priority: input.priority,
      institutionId,
      ...(input.scope === 'SPECIFIC' && input.institutionIds.length > 0
        ? {
            targets: {
              create: input.institutionIds.map((instId) => ({
                institutionId: instId,
              })),
            },
          }
        : {}),
    },
    include: {
      targets: true,
    },
  });

  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath('/admin/banners');

  return { success: true, bannerId: banner.id };
}

export async function updateBanner(id: string, rawInput: unknown) {
  await requireAdmin();

  const input = updateBannerSchema.parse(rawInput);

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Banner not found');
  }

  const startsAt = input.startsAt
    ? typeof input.startsAt === 'string'
      ? new Date(input.startsAt)
      : input.startsAt
    : undefined;

  const endsAt = input.endsAt !== undefined
    ? input.endsAt === null
      ? null
      : typeof input.endsAt === 'string'
        ? new Date(input.endsAt)
        : input.endsAt
    : undefined;

  // Determine institutionId for backward compat
  const institutionId =
    input.scope !== undefined && input.scope === 'SPECIFIC' && input.institutionIds && input.institutionIds.length === 1
      ? input.institutionIds[0]
      : undefined;

  const banner = await prisma.banner.update({
    where: { id },
    data: {
      title: input.title,
      message: input.message,
      ctaLabel: input.ctaLabel,
      ctaUrl: input.ctaUrl,
      imageUrl: input.imageUrl,
      variant: input.variant,
      placement: input.placement,
      scope: input.scope,
      startsAt,
      endsAt,
      isActive: input.isActive,
      priority: input.priority,
      institutionId,
    },
  });

  // Handle targets update
  if (input.scope === 'SPECIFIC' && input.institutionIds) {
    // Delete existing targets
    await prisma.bannerTarget.deleteMany({ where: { bannerId: id } });
    // Create new targets
    if (input.institutionIds.length > 0) {
      await prisma.bannerTarget.createMany({
        data: input.institutionIds.map((instId) => ({
          bannerId: id,
          institutionId: instId,
        })),
      });
    }
  } else if (input.scope === 'GLOBAL' || input.scope === 'ALL') {
    // Delete all targets when switching to GLOBAL or ALL
    await prisma.bannerTarget.deleteMany({ where: { bannerId: id } });
  }

  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath('/admin/banners');

  return { success: true, bannerId: banner.id };
}

export async function deleteBanner(id: string) {
  await requireAdmin();

  await prisma.banner.delete({ where: { id } });

  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath('/admin/banners');

  return { success: true };
}

export async function toggleBannerActive(id: string) {
  await requireAdmin();

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Banner not found');
  }

  await prisma.banner.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath('/admin/banners');

  return { success: true, isActive: !existing.isActive };
}
