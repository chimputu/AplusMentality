'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Role } from '../../generated/prisma/client';
import { clerkClient } from '@clerk/nextjs/server';
import { updateUserClerkOrgRole, APP_ROLE_TO_CLERK, addUserToClerkOrg } from '@/lib/clerk-org';

// ============================================
// Internal Helpers
// ============================================

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true, clerkId: true, institutionId: true, email: true },
  });
  if (!user) throw new Error('User not found');

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('Admin access required');
  }
  return user;
}

// ============================================
// Schemas
// ============================================

const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

const reassignUserAcademicSchema = z.object({
  institutionId: z.string().optional(),
  facultyId: z.string().optional(),
  programmeId: z.string().optional(),
  levelId: z.string().optional(),
  periodId: z.string().optional(),
  branchId: z.string().optional(),
});

const joinUniversitySchema = z.object({
  slug: z.string().min(1),
  programmeId: z.string().optional(),
  year: z.coerce.number().int().min(1).max(10).optional(),
  period: z.string().optional(),
  branchId: z.string().optional(),
});

const completeOnboardingSchema = z.object({
  institutionId: z.string().min(1),
  programmeId: z.string().optional(),
  year: z.coerce.number().int().min(1).max(10).optional(),
  period: z.string().optional(),
  branchId: z.string().optional(),
});

// ============================================
// Server Actions
// ============================================

export async function listUsers(filters?: {
  role?: Role;
  institutionId?: string | null;
  search?: string;
  onboarded?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const adminUser = await requireAdmin();

  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  // Strict tenant isolation: ADMIN can only see users in their own institution
  // SUPER_ADMIN bypasses this and sees all users globally
  if (adminUser.role === 'ADMIN' && adminUser.institutionId) {
    where.institutionId = adminUser.institutionId;
  }
  // SUPER_ADMIN: no institution filter — full global visibility

  if (filters?.role) where.role = filters.role;
  // Only allow SUPER_ADMIN to filter by institutionId from query params
  if (adminUser.role === 'SUPER_ADMIN' && filters?.institutionId !== undefined) where.institutionId = filters.institutionId;
  if (filters?.onboarded !== undefined) where.onboarded = filters.onboarded;
  if (filters?.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } },
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { username: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        institution: { select: { id: true, name: true } },
        programme: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getUser(id: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      institution: { select: { id: true, name: true, slug: true } },
      programme: { select: { id: true, name: true, code: true } },
      branch: { select: { id: true, name: true } },
      enrollments: {
        include: {
          course: { select: { id: true, code: true, title: true } },
        },
      },
      courses: { select: { id: true, code: true, title: true } },
      announcements: { select: { id: true, title: true, createdAt: true } },
    },
  });

  if (!user) throw new Error('User not found');

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    enrollments: user.enrollments.map((e) => ({
      ...e,
      enrolledAt: e.enrolledAt.toISOString(),
    })),
    announcements: user.announcements.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

export async function updateUserRole(id: string, rawInput: unknown) {
  await requireAdmin();

  const input = updateUserRoleSchema.parse(rawInput);

  const user = await prisma.user.update({
    where: { id },
    data: { role: input.role },
    include: {
      institution: { select: { clerkOrgId: true } },
    },
  });

  // Sync role change to Clerk org membership so Clerk and DB stay in sync
  const clerkOrgRole = APP_ROLE_TO_CLERK[input.role];
  if (clerkOrgRole && user.clerkId) {
    // Try to sync via the user's institution org
    if (user.institution?.clerkOrgId) {
      await updateUserClerkOrgRole(user.clerkId, user.institution.clerkOrgId, clerkOrgRole)
        .catch((err) => console.error('[ServerAction] Failed to sync role to Clerk:', err));
    }
    // Also check active clerkOrgId on the user
    const activeOrgId = user.clerkOrgId;
    if (activeOrgId && activeOrgId !== user.institution?.clerkOrgId) {
      await updateUserClerkOrgRole(user.clerkId, activeOrgId, clerkOrgRole)
        .catch((err) => console.error('[ServerAction] Failed to sync role to Clerk (active org):', err));
    }
  }

  revalidatePath('/admin/users');
  return { success: true, role: user.role };
}

export async function reassignUserAcademic(id: string, rawInput: unknown) {
  await requireAdmin();

  const input = reassignUserAcademicSchema.parse(rawInput);

  const data: any = {};
  if (input.institutionId !== undefined) data.institutionId = input.institutionId || null;
  if (input.facultyId !== undefined) data.programmeId = input.programmeId || null;
  if (input.programmeId !== undefined) data.programmeId = input.programmeId || null;
  if (input.levelId !== undefined) {
    // Map levelId to year number
    const level = await prisma.academicLevel.findUnique({ where: { id: input.levelId } });
    if (level) data.year = level.order;
  }
  if (input.periodId !== undefined) {
    const period = await prisma.academicPeriod.findUnique({ where: { id: input.periodId } });
    if (period) data.period = String(period.order);
  }
  if (input.branchId !== undefined) data.branchId = input.branchId || null;

  await prisma.user.update({
    where: { id },
    data,
  });

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${id}`);
  return { success: true };
}

export async function deactivateUser(id: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found');

  // Ban user in Clerk (revokes sessions and prevents sign-in)
  try {
    const client = await clerkClient();
    await client.users.banUser(user.clerkId);
  } catch (error) {
    console.error('Failed to ban user in Clerk:', error);
    // Continue anyway — user is deactivated in our DB
  }

  // Remove academic associations
  await prisma.user.update({
    where: { id },
    data: {
      onboarded: false,
      institutionId: null,
      programmeId: null,
      branchId: null,
      year: null,
      period: null,
    },
  });

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${id}`);
  return { success: true };
}

export async function reactivateUser(id: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found');

  // Unban user in Clerk (allows sign-in again)
  try {
    const client = await clerkClient();
    await client.users.unbanUser(user.clerkId);
  } catch (error) {
    console.error('Failed to unban user in Clerk:', error);
  }

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${id}`);
  return { success: true };
}

export async function deleteUser(id: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found');

  // Delete from Clerk
  try {
    const client = await clerkClient();
    await client.users.deleteUser(user.clerkId);
  } catch (error) {
    console.error('Failed to delete user from Clerk:', error);
    // Continue anyway — delete from our DB
  }

  // Delete from Prisma (cascade handles related records)
  await prisma.user.delete({ where: { id } });

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Magic Join Link Server Action — handles the full join flow with Clerk double-write.
 *
 * 1. Finds the Organization (Institution or University) by its join slug.
 * 2. **Clerk Write:** Adds the user to the Clerk organization as `org:member`.
 * 3. **Prisma Write:** Updates the User with academic data and marks as onboarded.
 * 4. Returns success/error; the caller redirects to `/student`.
 *
 * Graceful degradation: Prisma write always succeeds even if Clerk fails.
 */
export async function joinUniversity(rawInput: unknown) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { error: 'You must be logged in to join.' };
  }

  const input = joinUniversitySchema.parse(rawInput);

  // Find the organization by slug — check Institution first, then University
  const institution = await prisma.university.findUnique({
    where: { slug: input.slug },
    select: { id: true, name: true, clerkOrgId: true },
  });

  const university = await prisma.legacyUniversity.findUnique({
    where: { joinSlug: input.slug },
    select: { id: true, name: true },
  });

  let orgType: 'institution' | 'university' | null = null;
  let orgId: string;
  let clerkOrgId: string | null = null;
  let orgName: string;

  if (institution) {
    orgType = 'institution';
    orgId = institution.id;
    clerkOrgId = institution.clerkOrgId;
    orgName = institution.name;
  } else if (university) {
    orgType = 'university';
    orgId = university.id;
    orgName = university.name;
  } else {
    return { error: 'Organization not found. The join link may be invalid.' };
  }

  // Find or create the Prisma user record
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  if (!user) {
    // User doesn't exist in Prisma yet — create a minimal record
    const clerkUser = await (await clerkClient()).users.getUser(clerkUserId);
    user = await prisma.user.create({
      data: {
        clerkId: clerkUserId,
        email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        name: clerkUser.fullName,
        imageUrl: clerkUser.imageUrl,
      },
    });
  }

  // Build the Prisma update data
  const updateData: any = {
    role: 'STUDENT',
    onboarded: true,
  };

  // Always use the canonical institution field
  updateData.institutionId = orgId;

  if (input.programmeId) updateData.programmeId = input.programmeId;
  if (input.year) updateData.year = input.year;
  if (input.period) updateData.period = input.period;
  if (input.branchId) updateData.branchId = input.branchId;

  // Also update clerkOrgId on the user if available
  if (clerkOrgId) {
    updateData.clerkOrgId = clerkOrgId;
    updateData.clerkOrgRole = 'org:member';
  }

  // --- Clerk Write: Add user to Clerk organization ---
  if (clerkOrgId) {
    const clerkResult = await addUserToClerkOrg(clerkUserId, clerkOrgId, 'org:member');
    if (!clerkResult.success) {
      // Log but don't fail — Prisma write is the source of truth
      console.warn(
        `[joinUniversity] Clerk org membership failed for ${clerkUserId} in ${clerkOrgId}:`,
        clerkResult.error,
      );
    }
  }

  // --- Prisma Write: Always commit ---
  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  revalidatePath('/student');
  return { success: true, orgType, orgName };
}

/**
 * Complete Onboarding Server Action — handles the standard onboarding form flow.
 *
 * 1. Authenticates the user via Clerk.
 * 2. Looks up the institution's Clerk organization ID.
 * 3. **Clerk Write:** Adds the user to the Clerk organization as `org:member`.
 * 4. **Prisma Write:** Updates the User with academic data and marks as onboarded.
 *
 * Graceful degradation: Prisma write always succeeds even if Clerk fails.
 */
export async function completeOnboarding(rawInput: unknown) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { error: 'You must be logged in to complete onboarding.' };
  }

  const input = completeOnboardingSchema.parse(rawInput);

  // Find the institution and its Clerk org ID
  const institution = await prisma.university.findUnique({
    where: { id: input.institutionId },
    select: { id: true, name: true, clerkOrgId: true },
  });

  if (!institution) {
    return { error: 'Institution not found.' };
  }

  // Find or create the Prisma user record
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  if (!user) {
    const clerkUser = await (await clerkClient()).users.getUser(clerkUserId);
    user = await prisma.user.create({
      data: {
        clerkId: clerkUserId,
        email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        name: clerkUser.fullName,
        imageUrl: clerkUser.imageUrl,
      },
    });
  }

  // Build the Prisma update data
  const updateData: any = {
    role: 'STUDENT',
    onboarded: true,
    institutionId: institution.id,
  };

  if (input.programmeId) updateData.programmeId = input.programmeId;
  if (input.year) updateData.year = input.year;
  if (input.period) updateData.period = input.period;
  if (input.branchId) updateData.branchId = input.branchId;

  // Update clerkOrgId on the user if available
  if (institution.clerkOrgId) {
    updateData.clerkOrgId = institution.clerkOrgId;
    updateData.clerkOrgRole = 'org:member';
  }

  // --- Clerk Write: Add user to Clerk organization ---
  if (institution.clerkOrgId) {
    const clerkResult = await addUserToClerkOrg(clerkUserId, institution.clerkOrgId, 'org:member');
    if (!clerkResult.success) {
      // Log but don't fail — Prisma write is the source of truth
      console.warn(
        `[completeOnboarding] Clerk org membership failed for ${clerkUserId} in ${institution.clerkOrgId}:`,
        clerkResult.error,
      );
    }
  }

  // --- Prisma Write: Always commit ---
  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  revalidatePath('/student');
  return { success: true, institutionName: institution.name };
}

/**
 * Sync a user's Prisma role to their Clerk org membership.
 * Useful when a role was changed outside the app (e.g., Prisma Studio).
 */
export async function syncUserRoleToClerk(clerkId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      institution: { select: { clerkOrgId: true } },
    },
  });

  if (!user) throw new Error('User not found');

  const clerkOrgRole = APP_ROLE_TO_CLERK[user.role];
  if (!clerkOrgRole) {
    throw new Error(`No Clerk role mapping for ${user.role}`);
  }

  let synced = false;

  // Sync to institution org
  if (user.institution?.clerkOrgId) {
    const result = await updateUserClerkOrgRole(
      user.clerkId,
      user.institution.clerkOrgId,
      clerkOrgRole,
    );
    if (result.success) synced = true;
  }

  // Sync to user's active org if different
  const activeOrgId = user.clerkOrgId;
  if (activeOrgId && activeOrgId !== user.institution?.clerkOrgId) {
    const result = await updateUserClerkOrgRole(user.clerkId, activeOrgId, clerkOrgRole);
    if (result.success) synced = true;
  }

  // If no orgs were found, still return success (user may not have an org yet)
  return { success: true, role: user.role, synced };
}
