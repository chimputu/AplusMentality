'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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

const createProgrammeSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  shortName: z.string().optional(),
  code: z.string().optional(),
  institutionId: z.string().min(1, 'Institution is required'),
  facultyId: z.string().optional(),
});

const updateProgrammeSchema = z.object({
  name: z.string().min(3).optional(),
  shortName: z.string().optional(),
  code: z.string().optional(),
  facultyId: z.string().optional().nullable(),
});

// ============================================
// Server Actions
// ============================================

export async function listProgrammes(options?: {
  institutionId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (options?.institutionId) {
    where.institutionId = options.institutionId;
  }
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { code: { contains: options.search, mode: 'insensitive' } },
      { shortName: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  const [programmes, total] = await Promise.all([
    prisma.programme.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: pageSize,
      include: {
        institution: { select: { id: true, name: true, slug: true } },
        faculty: { select: { id: true, name: true, code: true } },
        _count: {
          select: {
            branches: true,
            courses: true,
            tutors: true,
            users: true,
          },
        },
      },
    }),
    prisma.programme.count({ where }),
  ]);

  return {
    programmes,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getProgramme(id: string) {
  const programme = await prisma.programme.findUnique({
    where: { id },
    include: {
      institution: true,
      faculty: true,
      branches: { orderBy: { name: 'asc' } },
      courses: { orderBy: { title: 'asc' } },
    },
  });

  return programme;
}

export async function createProgramme(rawInput: unknown) {
  await requireAdmin();

  const input = createProgrammeSchema.parse(rawInput);

  // Check code uniqueness within institution
  if (input.code) {
    const existing = await prisma.programme.findUnique({
      where: { institutionId_code: { institutionId: input.institutionId, code: input.code } },
    });
    if (existing) throw new Error('Code is already taken for this institution');
  }

  const programme = await prisma.programme.create({
    data: {
      name: input.name,
      shortName: input.shortName || null,
      code: input.code || null,
      institutionId: input.institutionId,
      facultyId: input.facultyId || null,
    },
    include: {
      institution: { select: { id: true, name: true } },
      faculty: { select: { id: true, name: true } },
    },
  });

  revalidatePath('/admin/programmes');

  return { success: true, programme };
}

export async function updateProgramme(id: string, rawInput: unknown) {
  await requireAdmin();

  const input = updateProgrammeSchema.parse(rawInput);

  // Check code uniqueness if code is being updated
  if (input.code) {
    const existing = await prisma.programme.findUnique({
      where: { institutionId_code: { institutionId: '', code: input.code } },
    });
    // We need the institutionId to check uniqueness
    const current = await prisma.programme.findUnique({ where: { id } });
    if (current?.institutionId) {
      const duplicate = await prisma.programme.findUnique({
        where: { institutionId_code: { institutionId: current.institutionId, code: input.code } },
      });
      if (duplicate && duplicate.id !== id) {
        throw new Error('Code is already taken for this institution');
      }
    }
  }

  const updated = await prisma.programme.update({
    where: { id },
    data: input,
    include: {
      institution: { select: { id: true, name: true } },
      faculty: { select: { id: true, name: true } },
    },
  });

  revalidatePath('/admin/programmes');

  return { success: true, programme: updated };
}

export async function deleteProgramme(id: string) {
  await requireAdmin();

  // Check if programme has dependent records
  const counts = await prisma.programme.findUnique({
    where: { id },
    include: {
      _count: { select: { branches: true, courses: true, tutors: true, users: true } },
    },
  });

  if (!counts) throw new Error('Programme not found');

  const totalDependents =
    counts._count.branches + counts._count.courses + counts._count.tutors + counts._count.users;

  if (totalDependents > 0) {
    throw new Error(
      `Cannot delete programme with ${totalDependents} dependent record(s) (branches, courses, tutors, users). Remove or reassign them first.`
    );
  }

  await prisma.programme.delete({ where: { id } });

  revalidatePath('/admin/programmes');

  return { success: true };
}

// Get all institutions for dropdown
export async function getInstitutionsForDropdown() {
  const institutions = await prisma.institution.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });
  return institutions;
}

// Get faculties for a given institution
export async function getFacultiesForInstitution(institutionId: string) {
  const faculties = await prisma.faculty.findMany({
    where: { institutionId },
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' },
  });
  return faculties;
}
