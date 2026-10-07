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

const createTutorSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  universityId: z.string().optional(),
  programmeId: z.string().optional(),
  branchId: z.string().optional(),
  yearsExperience: z.number().min(0).max(60).default(0),
  availability: z.string().optional(),
  mode: z.string().default('online'),
  contactVia: z.string().default('form'),
  isVerified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  specialtyCourseIds: z.array(z.string()).optional(),
});

const updateTutorSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  universityId: z.string().nullable().optional(),
  programmeId: z.string().nullable().optional(),
  branchId: z.string().nullable().optional(),
  yearsExperience: z.number().min(0).max(60).optional(),
  availability: z.string().optional(),
  mode: z.string().optional(),
  contactVia: z.string().optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// Server Actions
// ============================================

export async function createTutor(rawInput: unknown) {
  await requireAdmin();

  const input = createTutorSchema.parse(rawInput);

  // Check email uniqueness
  const existing = await prisma.tutor.findUnique({ where: { email: input.email } });
  if (existing) throw new Error('A tutor with this email already exists');

  const { specialtyCourseIds, ...tutorData } = input;

  const tutor = await prisma.tutor.create({
    data: {
      ...tutorData,
      specialties: specialtyCourseIds && specialtyCourseIds.length > 0
        ? {
            create: specialtyCourseIds.map((courseId) => ({
              course: { connect: { id: courseId } },
            })),
          }
        : undefined,
    },
    include: {
      specialties: { include: { course: true } },
    },
  });

  revalidatePath('/admin/tutors');
  return tutor;
}

export async function updateTutor(id: string, rawInput: unknown) {
  await requireAdmin();

  const input = updateTutorSchema.parse(rawInput);

  const tutor = await prisma.tutor.update({
    where: { id },
    data: input,
  });

  revalidatePath('/admin/tutors');
  revalidatePath(`/admin/tutors/${id}`);
  return tutor;
}

export async function toggleTutorStatus(id: string, isActive: boolean) {
  await requireAdmin();

  await prisma.tutor.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath('/admin/tutors');
}

export async function toggleTutorVerified(id: string, isVerified: boolean) {
  await requireAdmin();

  await prisma.tutor.update({
    where: { id },
    data: { isVerified },
  });

  revalidatePath('/admin/tutors');
  revalidatePath(`/admin/tutors/${id}`);
}

export async function deleteTutor(id: string) {
  await requireAdmin();

  await prisma.tutor.delete({
    where: { id },
  });

  revalidatePath('/admin/tutors');
}

// ============================================
// Data Fetching (for dropdowns)
// ============================================

export async function listUniversities() {
  return prisma.university.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' },
  });
}

export async function listProgrammes(universityId?: string) {
  const where: any = {};
  if (universityId) {
    where.universityId = universityId;
  }
  return prisma.programme.findMany({
    where,
    select: { id: true, name: true, code: true, university: { select: { name: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function listBranches(programmeId: string) {
  return prisma.branch.findMany({
    where: { programmeId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

export async function listCourses(universityId?: string) {
  const where: any = { isPublished: true };
  if (universityId) {
    where.universityId = universityId;
  }
  return prisma.course.findMany({
    where,
    select: { id: true, code: true, title: true },
    orderBy: { title: 'asc' },
    take: 100,
  });
}
