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

const addCourseSchema = z.object({
  programmeId: z.string(),
  levelId: z.string(),
  periodId: z.string().optional(),
  facultyId: z.string().optional(),
  code: z.string().min(1).transform((s) => s.toUpperCase()),
  name: z.string().min(1),
  description: z.string().optional(),
});

const bulkCourseSchema = z.object({
  code: z.string().min(1).transform((s) => s.toUpperCase()),
  name: z.string().min(1),
  description: z.string().optional(),
});

const bulkAddCoursesSchema = z.object({
  programmeId: z.string(),
  levelId: z.string(),
  periodId: z.string().optional(),
  facultyId: z.string().optional(),
  courses: z.array(bulkCourseSchema).min(1),
});

// ============================================
// Server Actions
// ============================================

export async function getProgrammesForUniversity(institutionId: string) {
  await requireAdmin();

  const programmes = await prisma.programme.findMany({
    where: { institutionId },
    select: {
      id: true,
      name: true,
      code: true,
      _count: {
        select: {
          courses: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return programmes;
}

export async function getProgrammeWithTree(programmeId: string) {
  await requireAdmin();

  const programme = await prisma.programme.findUnique({
    where: { id: programmeId },
    include: {
      institution: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!programme) throw new Error('Programme not found');

  const institutionId = programme.institutionId;

  // Fetch all levels for the institution
  const levels = await prisma.academicLevel.findMany({
    where: { institutionId: institutionId || undefined },
    orderBy: { order: 'asc' },
  });

  // Fetch all courses for this programme
  const courses = await prisma.course.findMany({
    where: { programmeId },
    include: {
      academicPeriod: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group courses by levelId
  const levelsWithCourses = levels.map((level) => ({
    id: level.id,
    name: level.name,
    order: level.order,
    courses: courses
      .filter((c) => c.levelId === level.id)
      .map((c) => ({
        id: c.id,
        code: c.code,
        name: c.title,
        description: c.description,
        yearNumber: c.yearNumber,
        period: c.academicPeriod,
        createdAt: c.createdAt.toISOString(),
      })),
  }));

  return {
    programme: {
      id: programme.id,
      name: programme.name,
      code: programme.code,
    },
    institution: programme.institution,
    levels: levelsWithCourses,
  };
}

export async function addCourseToProgramme(rawInput: unknown) {
  const admin = await requireAdmin();

  const input = addCourseSchema.parse(rawInput);

  // Verify programme belongs to admin's institution
  const programme = await prisma.programme.findUnique({ where: { id: input.programmeId } });
  if (!programme) throw new Error('Programme not found');
  if (admin.institutionId && programme.institutionId !== admin.institutionId) {
    throw new Error('Programme does not belong to your institution');
  }

  // Verify levelId belongs to the same institution
  const level = await prisma.academicLevel.findUnique({ where: { id: input.levelId } });
  if (!level) throw new Error('Academic level not found');
  if (programme.institutionId && level.institutionId !== programme.institutionId) {
    throw new Error('Level does not belong to the same institution');
  }

  const course = await prisma.course.create({
    data: {
      code: input.code,
      title: input.name,
      description: input.description,
      programmeId: input.programmeId,
      levelId: input.levelId,
      periodId: input.periodId,
      yearNumber: level.order,
      createdBy: admin.clerkId,
      year: level.order,
      period: input.periodId ? String(level.order) : undefined,
    },
  });

  revalidatePath('/admin/programmes');
  revalidatePath('/admin/courses');
  return { success: true, courseId: course.id };
}

export async function updateCourse(id: string, rawInput: unknown) {
  await requireAdmin();

  const input = addCourseSchema.partial().parse(rawInput);

  const data: any = {};
  if (input.code !== undefined) data.code = input.code.toUpperCase();
  if (input.name !== undefined) data.title = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.programmeId !== undefined) data.programmeId = input.programmeId;
  if (input.levelId !== undefined) {
    data.levelId = input.levelId;
    const level = await prisma.academicLevel.findUnique({ where: { id: input.levelId } });
    if (level) {
      data.yearNumber = level.order;
      data.year = level.order;
    }
  }
  if (input.periodId !== undefined) data.periodId = input.periodId;

  await prisma.course.update({
    where: { id },
    data,
  });

  revalidatePath('/admin/programmes');
  revalidatePath('/admin/courses');
  return { success: true, courseId: id };
}

export async function deleteCourse(id: string) {
  await requireAdmin();

  // Check if content is attached
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          modules: true,
          videos: true,
          lectureSlides: true,
          pastPapers: true,
          quizzes: true,
          tests: true,
          assignments: true,
          tutorialSheets: true,
          assessments: true,
        },
      },
    },
  });

  if (!course) throw new Error('Course not found');

  const hasContent = Object.values(course._count).some((count) => count > 0);
  if (hasContent) {
    throw new Error('Cannot delete course with attached content. Remove all content first.');
  }

  await prisma.course.delete({ where: { id } });

  revalidatePath('/admin/programmes');
  revalidatePath('/admin/courses');
  return { success: true };
}

export async function bulkAddCourses(rawInput: unknown) {
  const admin = await requireAdmin();

  const input = bulkAddCoursesSchema.parse(rawInput);

  // Verify programme
  const programme = await prisma.programme.findUnique({ where: { id: input.programmeId } });
  if (!programme) throw new Error('Programme not found');

  // Verify level
  const level = await prisma.academicLevel.findUnique({ where: { id: input.levelId } });
  if (!level) throw new Error('Academic level not found');

  const created: string[] = [];
  const errors: string[] = [];

  // Use transaction for atomicity
  await prisma.$transaction(
    async (tx) => {
      for (const courseInput of input.courses) {
        try {
          await tx.course.create({
            data: {
              code: courseInput.code,
              title: courseInput.name,
              description: courseInput.description,
              programmeId: input.programmeId,
              levelId: input.levelId,
              periodId: input.periodId,
              yearNumber: level.order,
              createdBy: admin.clerkId,
              year: level.order,
            },
          });
          created.push(courseInput.code);
        } catch (error: any) {
          errors.push(`${courseInput.code}: ${error.message || 'Failed to create'}`);
        }
      }
    },
    { maxWait: 5000, timeout: 30000 }
  );

  revalidatePath('/admin/programmes');
  revalidatePath('/admin/courses');
  return { created, errors };
}
