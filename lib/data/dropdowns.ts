'use server';

import { prisma } from '@/lib/prisma';

/**
 * Single source of truth for all dropdown data fetchers.
 * Every dropdown in the app uses one of these functions.
 * Change the fetch logic once → every dropdown updates.
 */

export async function fetchInstitutionsForDropdown() {
  return prisma.institution.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      shortName: true,
      slug: true,
      type: true,
      logoUrl: true,
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Returns ONLY Institution records with type UNIVERSITY.
 * This is the strict university query used by all dropdowns that should
 * show actual universities — not regulatory bodies, colleges, or polytechnics.
 */
export async function fetchStrictUniversitiesForDropdown() {
  return prisma.institution.findMany({
    where: {
      isActive: true,
      type: 'UNIVERSITY',
    },
    select: {
      id: true,
      name: true,
      shortName: true,
      slug: true,
      type: true,
      logoUrl: true,
      periodType: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function fetchProgrammesForDropdown(institutionId?: string) {
  return prisma.programme.findMany({
    where: {
      ...(institutionId && { institutionId }),
    },
    select: {
      id: true,
      name: true,
      code: true,
      institutionId: true,
      facultyId: true,
      institution: {
        select: { id: true, name: true, shortName: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function fetchFacultiesForDropdown(institutionId?: string) {
  return prisma.faculty.findMany({
    where: {
      ...(institutionId && { institutionId }),
    },
    select: {
      id: true,
      name: true,
      code: true,
      institutionId: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function fetchCoursesForDropdown(programmeId?: string) {
  return prisma.course.findMany({
    where: {
      ...(programmeId && { programmeId }),
    },
    select: {
      id: true,
      code: true,
      title: true,
      programmeId: true,
      levelId: true,
      periodId: true,
      programme: {
        select: { id: true, name: true, code: true },
      },
    },
    orderBy: [{ code: 'asc' }],
  });
}

export async function fetchLevelsForDropdown(institutionId?: string) {
  return prisma.academicLevel.findMany({
    where: {
      ...(institutionId && { institutionId }),
    },
    select: {
      id: true,
      name: true,
      order: true,
      institutionId: true,
    },
    orderBy: { order: 'asc' },
  });
}

export async function fetchPeriodsForDropdown(institutionId?: string) {
  return prisma.academicPeriod.findMany({
    where: {
      ...(institutionId && { institutionId }),
    },
    select: {
      id: true,
      name: true,
      order: true,
      institutionId: true,
    },
    orderBy: { order: 'asc' },
  });
}

export async function fetchTutorsForDropdown(institutionId?: string) {
  return prisma.user.findMany({
    where: {
      role: { in: ['LECTURER', 'ADMIN'] },
      isVerifiedTutor: true,
      ...(institutionId && { institutionId }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      imageUrl: true,
      institutionId: true,
    },
    orderBy: { firstName: 'asc' },
  });
}

export async function fetchStudentsForDropdown(institutionId?: string) {
  return prisma.user.findMany({
    where: {
      role: 'STUDENT',
      ...(institutionId && { institutionId }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    orderBy: { firstName: 'asc' },
  });
}

export async function fetchBranchesForDropdown(programmeId?: string) {
  return prisma.branch.findMany({
    where: {
      ...(programmeId && { programmeId }),
    },
    select: {
      id: true,
      name: true,
      programmeId: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function fetchQuestionsForDropdown(courseId?: string) {
  return prisma.question.findMany({
    where: {
      ...(courseId && { courseId }),
    },
    select: {
      id: true,
      prompt: true,
      type: true,
      courseId: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
