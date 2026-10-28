'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getOrgScope } from '@/lib/auth/org-scope';
import { getCourseInstitutionId } from '@/lib/auth/exploration';

// ============================================
// Internal Helpers
// ============================================

async function requireAdminWithOrg() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('Admin access required');
  }

  const scope = await getOrgScope();
  return { admin: user, scope };
}

// ============================================
// Assign a Tutor to a Course
// ============================================

export async function assignTutorToCourse(courseId: string, tutorUserId: string) {
  try {
    const { admin, scope } = await requireAdminWithOrg();

    // SUPER_ADMIN can assign across institutions; ADMIN is scoped to their institution
    if (!scope.isSuperAdmin) {
      const courseInstitutionId = await getCourseInstitutionId(courseId);
      if (!courseInstitutionId) {
        return { success: false, error: 'Course not found or not linked to an institution' };
      }
      if (courseInstitutionId !== scope.institutionId) {
        return { success: false, error: 'Course does not belong to your institution' };
      }

      // Verify the tutor belongs to the same institution
      const tutorUser = await prisma.user.findUnique({
        where: { id: tutorUserId },
        select: { institutionId: true, role: true },
      });

      if (!tutorUser) {
        return { success: false, error: 'User not found' };
      }

      if (tutorUser.role !== 'TUTOR') {
        return { success: false, error: 'User is not a tutor' };
      }

      if (tutorUser.institutionId && tutorUser.institutionId !== scope.institutionId) {
        return { success: false, error: 'Tutor does not belong to your institution' };
      }
    }

    // Find the Tutor record for the user
    const tutor = await prisma.tutor.findUnique({
      where: { userId: tutorUserId },
      select: { id: true },
    });

    if (!tutor) {
      return { success: false, error: 'Tutor record not found for this user' };
    }

    // Verify the course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, code: true, title: true },
    });

    if (!course) {
      return { success: false, error: 'Course not found' };
    }

    // Create or update the TutorSpecialty (unique constraint on [tutorId, courseId])
    const specialty = await prisma.tutorSpecialty.upsert({
      where: {
        tutorId_courseId: { tutorId: tutor.id, courseId },
      },
      create: {
        tutorId: tutor.id,
        courseId,
      },
      update: {
        // If already assigned, just refresh
        personalEnabled: true,
      },
    });

    // Also set the Course's primary tutor
    await prisma.course.update({
      where: { id: courseId },
      data: { tutorId: tutor.id },
    });

    revalidatePath('/admin/tutors');
    revalidatePath('/admin/courses');

    return {
      success: true,
      specialty,
      message: `Tutor assigned to ${course.code} (${course.title})`,
    };
  } catch (err: any) {
    console.error('[assignTutorToCourse] Error:', err);
    return { success: false, error: err.message || 'Failed to assign tutor to course' };
  }
}

// ============================================
// Remove a Tutor from a Course
// ============================================

export async function removeTutorFromCourse(courseId: string, tutorUserId: string) {
  try {
    const { admin, scope } = await requireAdminWithOrg();

    // SUPER_ADMIN can remove across institutions; ADMIN is scoped
    if (!scope.isSuperAdmin) {
      const courseInstitutionId = await getCourseInstitutionId(courseId);
      if (!courseInstitutionId) {
        return { success: false, error: 'Course not found or not linked to an institution' };
      }
      if (courseInstitutionId !== scope.institutionId) {
        return { success: false, error: 'Course does not belong to your institution' };
      }
    }

    // Find the Tutor record
    const tutor = await prisma.tutor.findUnique({
      where: { userId: tutorUserId },
      select: { id: true },
    });

    if (!tutor) {
      return { success: false, error: 'Tutor record not found' };
    }

    // Delete the TutorSpecialty
    await prisma.tutorSpecialty.deleteMany({
      where: { tutorId: tutor.id, courseId },
    });

    revalidatePath('/admin/tutors');
    revalidatePath('/admin/courses');

    return {
      success: true,
      message: 'Tutor removed from course',
    };
  } catch (err: any) {
    console.error('[removeTutorFromCourse] Error:', err);
    return { success: false, error: err.message || 'Failed to remove tutor from course' };
  }
}

// ============================================
// List Tutor Specialties for a Course
// ============================================

export async function listCourseTutors(courseId: string) {
  try {
    const { admin, scope } = await requireAdminWithOrg();

    // SUPER_ADMIN can see all; ADMIN is scoped
    if (!scope.isSuperAdmin) {
      const courseInstitutionId = await getCourseInstitutionId(courseId);
      if (!courseInstitutionId) {
        return { success: false, error: 'Course not found or not linked to an institution' };
      }
      if (courseInstitutionId !== scope.institutionId) {
        return { success: false, error: 'Course does not belong to your institution' };
      }
    }

    const specialties = await prisma.tutorSpecialty.findMany({
      where: { courseId },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { tutor: { fullName: 'asc' } },
    });

    return {
      success: true,
      tutors: specialties.map((s) => ({
        specialtyId: s.id,
        tutorId: s.tutorId,
        userId: s.tutor.userId,
        fullName: s.tutor.fullName,
        email: s.tutor.email,
        personalEnabled: s.personalEnabled,
        personalRate: s.personalRate?.toNumber(),
        groupEnabled: s.groupEnabled,
        groupRate: s.groupRate?.toNumber(),
        currency: s.currency,
        notes: s.notes,
      })),
    };
  } catch (err: any) {
    console.error('[listCourseTutors] Error:', err);
    return { success: false, error: err.message || 'Failed to list course tutors' };
  }
}

// ============================================
// Update Tutor Specialty settings
// ============================================

export async function updateTutorSpecialty(
  courseId: string,
  tutorUserId: string,
  data: {
    personalEnabled?: boolean;
    personalRate?: number | null;
    groupEnabled?: boolean;
    groupRate?: number | null;
    groupMinSize?: number | null;
    groupMaxSize?: number | null;
    currency?: string;
    notes?: string | null;
  }
) {
  try {
    const { admin, scope } = await requireAdminWithOrg();

    if (!scope.isSuperAdmin) {
      const courseInstitutionId = await getCourseInstitutionId(courseId);
      if (!courseInstitutionId || courseInstitutionId !== scope.institutionId) {
        return { success: false, error: 'Course does not belong to your institution' };
      }
    }

    const tutor = await prisma.tutor.findUnique({
      where: { userId: tutorUserId },
      select: { id: true },
    });

    if (!tutor) {
      return { success: false, error: 'Tutor record not found' };
    }

    const updateData: any = {};
    if (data.personalEnabled !== undefined) updateData.personalEnabled = data.personalEnabled;
    if (data.personalRate !== undefined) updateData.personalRate = data.personalRate;
    if (data.groupEnabled !== undefined) updateData.groupEnabled = data.groupEnabled;
    if (data.groupRate !== undefined) updateData.groupRate = data.groupRate;
    if (data.groupMinSize !== undefined) updateData.groupMinSize = data.groupMinSize;
    if (data.groupMaxSize !== undefined) updateData.groupMaxSize = data.groupMaxSize;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const specialty = await prisma.tutorSpecialty.update({
      where: {
        tutorId_courseId: { tutorId: tutor.id, courseId },
      },
      data: updateData,
    });

    revalidatePath('/admin/tutors');

    return {
      success: true,
      specialty,
      message: 'Tutor specialty updated',
    };
  } catch (err: any) {
    console.error('[updateTutorSpecialty] Error:', err);
    return { success: false, error: err.message || 'Failed to update tutor specialty' };
  }
}
