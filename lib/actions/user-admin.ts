'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Role } from '../../generated/prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

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
  await requireAdmin();

  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (filters?.role) where.role = filters.role;
  if (filters?.institutionId !== undefined) where.institutionId = filters.institutionId;
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
  });

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
