'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export interface AccessContext {
  userId: string;
  userInstitutionId: string | null;
  isAuthenticated: boolean;
  canAccessFullContent: (institutionId: string) => boolean;
  isExploring: (institutionId: string) => boolean;
}

/**
 * Get the current user's access context for exploration.
 * Determines whether the user can access full content or only previews.
 */
export async function getAccessContext(): Promise<AccessContext> {
  const { userId } = await auth();

  if (!userId) {
    return {
      userId: '',
      userInstitutionId: null,
      isAuthenticated: false,
      canAccessFullContent: () => false,
      isExploring: () => false,
    };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, institutionId: true },
  });

  const userInstitutionId = user?.institutionId ?? null;

  return {
    userId: user?.id ?? '',
    userInstitutionId,
    isAuthenticated: true,
    canAccessFullContent: (institutionId: string) =>
      userInstitutionId === institutionId,
    isExploring: (institutionId: string) =>
      !!userInstitutionId && userInstitutionId !== institutionId,
  };
}

/**
 * Verify the requested resource belongs to the target institution.
 * Prevents IDOR by always checking institution match.
 */
export async function verifyResourceBelongsToInstitution(
  resourceType: 'course' | 'programme' | 'institution',
  resourceId: string,
  institutionId: string
): Promise<boolean> {
  switch (resourceType) {
    case 'institution':
      return resourceId === institutionId;

    case 'programme': {
      const programme = await prisma.programme.findUnique({
        where: { id: resourceId },
        select: { institutionId: true },
      });
      return programme?.institutionId === institutionId;
    }

    case 'course': {
      // Course links to Programme, which links to Institution
      const course = await prisma.course.findUnique({
        where: { id: resourceId },
        select: {
          programme: { select: { institutionId: true } },
        },
      });
      return course?.programme?.institutionId === institutionId;
    }

    default:
      return false;
  }
}

/**
 * Resolve the institution ID for a given course.
 * Traverses Course → Programme → Institution.
 */
export async function getCourseInstitutionId(courseId: string): Promise<string | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      programme: { select: { institutionId: true } },
    },
  });
  return course?.programme?.institutionId ?? null;
}

/**
 * Resolve the institution ID for a given course code within an institution slug.
 * Returns the course ID and institution ID pair.
 */
export async function resolveCourseByCode(
  institutionSlug: string,
  courseCode: string
): Promise<{ courseId: string; institutionId: string } | null> {
  const institution = await prisma.university.findUnique({
    where: { slug: institutionSlug },
    select: { id: true },
  });

  if (!institution) return null;

  // Find the course via the institution's programmes
  const programmes = await prisma.programme.findMany({
    where: { institutionId: institution.id },
    select: { id: true },
  });

  const programmeIds = programmes.map((p) => p.id);
  if (programmeIds.length === 0) return null;

  const course = await prisma.course.findFirst({
    where: {
      code: courseCode,
      programmeId: { in: programmeIds },
    },
    select: { id: true },
  });

  if (!course) return null;

  return { courseId: course.id, institutionId: institution.id };
}
