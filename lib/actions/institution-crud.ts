'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { InstitutionType, LevelType, PeriodType } from '../../generated/prisma/client';
import { createClerkOrg } from '@/lib/clerk-org';

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

async function requireSuperAdmin() {
  const { userId, orgRole } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  if (user.role !== 'SUPER_ADMIN' || orgRole !== 'org:super_admin') {
    throw new Error('Unauthorized: Only the Platform Super Admin can create Universities.');
  }
  return user;
}

function getLevelPrefix(levelType: LevelType): string {
  switch (levelType) {
    case LevelType.YEAR: return 'Year';
    case LevelType.STAGE: return 'Stage';
    case LevelType.PHASE: return 'Phase';
    case LevelType.GRADE: return 'Grade';
  }
}

function getPeriodPrefix(periodType: PeriodType): string {
  switch (periodType) {
    case PeriodType.SEMESTER: return 'Semester';
    case PeriodType.TERM: return 'Term';
    case PeriodType.TRIMESTER: return 'Trimester';
    case PeriodType.QUARTER: return 'Quarter';
    case PeriodType.BLOCK: return 'Block';
  }
}

// ============================================
// Schemas
// ============================================

const createInstitutionSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  shortName: z.string().optional(),
  type: z.nativeEnum(InstitutionType),
  description: z.string().optional(),
  country: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  logoUrl: z.string().optional(),
  levelType: z.nativeEnum(LevelType),
  numLevels: z.number().min(1).max(10),
  periodType: z.nativeEnum(PeriodType),
  numPeriods: z.number().min(1).max(12),
  hasFaculties: z.boolean().default(false),
  hasBranches: z.boolean().default(false),
});

const updateInstitutionSchema = z.object({
  name: z.string().min(3).optional(),
  shortName: z.string().optional(),
  type: z.nativeEnum(InstitutionType).optional(),
  description: z.string().optional(),
  country: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  logoUrl: z.string().optional(),
  levelType: z.nativeEnum(LevelType).optional(),
  numLevels: z.number().min(1).max(10).optional(),
  periodType: z.nativeEnum(PeriodType).optional(),
  numPeriods: z.number().min(1).max(12).optional(),
  hasFaculties: z.boolean().optional(),
  hasBranches: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

// ============================================
// Server Actions
// ============================================

export async function createInstitution(rawInput: unknown) {
  await requireSuperAdmin();

  const input = createInstitutionSchema.parse(rawInput);

  // Check slug uniqueness
  const existing = await prisma.institution.findUnique({ where: { slug: input.slug } });
  if (existing) throw new Error('Slug is already taken');

  const institution = await prisma.institution.create({ data: input as any });

  // Auto-generate AcademicLevels
  const levelPrefix = getLevelPrefix(input.levelType);
  const levels = [];
  for (let i = 1; i <= input.numLevels; i++) {
    levels.push(
      prisma.academicLevel.create({
        data: { institutionId: institution.id, name: `${levelPrefix} ${i}`, order: i },
      })
    );
  }
  await Promise.all(levels);

  // Auto-generate AcademicPeriods
  const periodPrefix = getPeriodPrefix(input.periodType);
  const periods = [];
  for (let i = 1; i <= input.numPeriods; i++) {
    periods.push(
      prisma.academicPeriod.create({
        data: { institutionId: institution.id, name: `${periodPrefix} ${i}`, order: i, academicYear: 2025 },
      })
    );
  }
  await Promise.all(periods);

  revalidatePath('/admin/institutions');

  return { success: true, institutionId: institution.id };
}

export async function updateInstitution(id: string, rawInput: unknown) {
  await requireAdmin();

  const input = updateInstitutionSchema.parse(rawInput);

  const institution = await prisma.institution.findUnique({ where: { id } });
  if (!institution) throw new Error('Institution not found');

  // Detect structural changes
  const structuralChanged =
    input.levelType !== undefined && input.levelType !== institution.levelType ||
    input.numLevels !== undefined && input.numLevels !== institution.numLevels ||
    input.periodType !== undefined && input.periodType !== institution.periodType ||
    input.numPeriods !== undefined && input.numPeriods !== institution.numPeriods;

  // Update institution
  const updated = await prisma.institution.update({ where: { id }, data: input });

  // Regenerate levels/periods if structural fields changed
  if (structuralChanged) {
    const currentLevelType = updated.levelType;
    const currentNumLevels = updated.numLevels;
    const currentPeriodType = updated.periodType;
    const currentNumPeriods = updated.numPeriods;

    // Delete existing
    await prisma.academicLevel.deleteMany({ where: { institutionId: id } });
    await prisma.academicPeriod.deleteMany({ where: { institutionId: id } });

    // Regenerate levels
    const levelPrefix = getLevelPrefix(currentLevelType);
    const levels = [];
    for (let i = 1; i <= currentNumLevels; i++) {
      levels.push(
        prisma.academicLevel.create({
          data: { institutionId: id, name: `${levelPrefix} ${i}`, order: i },
        })
      );
    }
    await Promise.all(levels);

    // Regenerate periods
    const periodPrefix = getPeriodPrefix(currentPeriodType);
    const periods = [];
    for (let i = 1; i <= currentNumPeriods; i++) {
      periods.push(
        prisma.academicPeriod.create({
          data: { institutionId: id, name: `${periodPrefix} ${i}`, order: i, academicYear: 2025 },
        })
      );
    }
    await Promise.all(periods);
  }

  revalidatePath('/admin/institutions');
  revalidatePath('/admin/institutions/[id]', 'page');

  return { success: true, institution: updated };
}

export async function deleteInstitution(id: string) {
  await requireAdmin();

  await prisma.institution.delete({ where: { id } });

  revalidatePath('/admin/institutions');

  return { success: true };
}

export async function toggleInstitutionActive(id: string) {
  await requireAdmin();

  const institution = await prisma.institution.findUnique({ where: { id } });
  if (!institution) throw new Error('Institution not found');

  const updated = await prisma.institution.update({
    where: { id },
    data: { isActive: !institution.isActive },
  });

  revalidatePath('/admin/institutions');

  return { success: true, isActive: updated.isActive };
}

export async function toggleInstitutionVerified(id: string) {
  await requireAdmin();

  const institution = await prisma.institution.findUnique({ where: { id } });
  if (!institution) throw new Error('Institution not found');

  const updated = await prisma.institution.update({
    where: { id },
    data: { isVerified: !institution.isVerified },
  });

  revalidatePath('/admin/institutions');

  return { success: true, isVerified: updated.isVerified };
}

export async function listInstitutions(filters?: {
  type?: string;
  search?: string;
  isActive?: boolean;
}) {
  const where: any = {};

  if (filters?.type) {
    where.type = filters.type;
  }
  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { shortName: { contains: filters.search, mode: 'insensitive' } },
      { city: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const institutions = await prisma.institution.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          levels: true,
          periods: true,
          faculties: true,
          programmes: true,
          users: true,
        },
      },
    },
  });

  return institutions;
}

export async function getInstitution(id: string) {
  const institution = await prisma.institution.findUnique({
    where: { id },
    include: {
      levels: { orderBy: { order: 'asc' } },
      periods: { orderBy: { order: 'asc' } },
      faculties: { orderBy: { name: 'asc' } },
      programmes: {
        orderBy: { name: 'asc' },
        include: {
          faculty: true,
          branches: { orderBy: { name: 'asc' } },
        },
      },
      _count: {
        select: {
          programmes: true,
          users: true,
        },
      },
    },
  });

  return institution;
}

export async function updateInstitutionSlug(institutionId: string, slug: string) {
  await requireAdmin();

  const slugSchema = z.string().min(3).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens');
  const parsed = slugSchema.parse(slug);

  // Check uniqueness
  const existing = await prisma.institution.findFirst({
    where: { slug: parsed, id: { not: institutionId } },
  });
  if (existing) throw new Error('Slug is already taken by another institution');

  await prisma.institution.update({
    where: { id: institutionId },
    data: { slug: parsed },
  });

  revalidatePath('/admin/settings');
  return { success: true };
}

export async function updateUniversityJoinSlug(universityId: string, joinSlug: string) {
  await requireAdmin();

  const slugSchema = z.string().min(3).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens');
  const parsed = slugSchema.parse(joinSlug);

  // Check uniqueness against both Institution.slug and University.joinSlug
  const existingInst = await prisma.institution.findUnique({ where: { slug: parsed } });
  if (existingInst) throw new Error('Slug is already taken by another institution');

  const existingUni = await prisma.university.findFirst({
    where: { joinSlug: parsed, id: { not: universityId } },
  });
  if (existingUni) throw new Error('Slug is already taken by another university');

  await prisma.university.update({
    where: { id: universityId },
    data: { joinSlug: parsed },
  });

  revalidatePath('/admin/settings');
  return { success: true };
}

export async function inviteAdmin(institutionId: string, emailAddress?: string) {
  await requireAdmin();

  const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
  if (!institution) throw new Error('Institution not found');

  // Auto-create Clerk org if missing
  let orgId = institution.clerkOrgId;
  if (!orgId) {
    const result = await createClerkOrg(institution.name, institution.slug);
    if (!result.success) throw new Error(`Failed to create organization: ${result.error}`);
    if (result.orgId) {
      orgId = result.orgId;
      await prisma.institution.update({
        where: { id: institutionId },
        data: { clerkOrgId: orgId, clerkOrgSlug: institution.slug },
      });
    }
  }

  if (!orgId) throw new Error('No Clerk organization available for this institution');

  const redirectUrl = 'https://aplusmentality.vercel.app/admin';

  // If email is provided, use Clerk invitation API (sends email)
  if (emailAddress) {
    const response = await fetch(`https://api.clerk.com/v1/organizations/${orgId}/invitations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: emailAddress,
        role: 'org:admin',
        redirect_url: redirectUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send invitation: ${errorText}`);
    }

    const data = await response.json();
    return { success: true, invitationUrl: data.url, emailSent: true };
  }

  // No email — generate a sign-up link with org slug pre-filled
  return {
    success: true,
    invitationUrl: `https://aplusmentality.vercel.app/sign-up?org_slug=${institution.slug}`,
    emailSent: false,
  };
}
