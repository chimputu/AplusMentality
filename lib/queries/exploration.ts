'use server';

import { prisma } from '@/lib/prisma';
import { getAccessContext } from '@/lib/auth/exploration';

/**
 * List all universities except the current user's own.
 */
export async function listExplorableUniversities() {
  const access = await getAccessContext();

  return prisma.institution.findMany({
    where: {
      isActive: true,
      isVerified: true,
      ...(access.userInstitutionId && {
        id: { not: access.userInstitutionId },
      }),
    },
    select: {
      id: true,
      name: true,
      shortName: true,
      slug: true,
      type: true,
      city: true,
      country: true,
      logoUrl: true,
      _count: {
        select: { programmes: true, faculties: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get a university's public profile with programmes + faculties.
 */
export async function getUniversityForExploration(slug: string) {
  const result = await prisma.institution.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      shortName: true,
      slug: true,
      type: true,
      description: true,
      city: true,
      country: true,
      logoUrl: true,
      website: true,
      faculties: {
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      },
      programmes: {
        select: {
          id: true,
          name: true,
          code: true,
          duration: true,
          faculty: { select: { id: true, name: true, code: true } },
          _count: { select: { courses: true } },
        },
        orderBy: { name: 'asc' },
      },
      _count: {
        select: { courses: true },
      },
    },
  });

  // Explicitly type the result to avoid Prisma type inference issues in builds
  return result as {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
    type: string;
    description: string | null;
    city: string | null;
    country: string | null;
    logoUrl: string | null;
    website: string | null;
    faculties: Array<{ id: string; name: string; code: string }>;
    programmes: Array<{
      id: string;
      name: string;
      code: string | null;
      duration: string | null;
      faculty: { id: string; name: string; code: string } | null;
      _count: { courses: number };
    }>;
    _count: { courses: number };
  } | null;
}

/**
 * Get a programme with its courses (metadata only, no private content).
 */
export async function getProgrammeForExploration(
  institutionSlug: string,
  programmeCode: string
) {
  const institution = await prisma.institution.findUnique({
    where: { slug: institutionSlug },
    select: { id: true },
  });

  if (!institution) return null;

  return prisma.programme.findFirst({
    where: {
      code: programmeCode,
      institutionId: institution.id,
    },
    select: {
      id: true,
      name: true,
      code: true,
      duration: true,
      description: true,
      institution: {
        select: {
          id: true,
          name: true,
          slug: true,
          shortName: true,
          logoUrl: true,
        },
      },
      faculty: { select: { name: true, code: true } },
      courses: {
        select: {
          id: true,
          code: true,
          title: true,
          description: true,
          yearNumber: true,
          _count: {
            select: {
              lectureSlides: true,
              tutorialSheets: true,
              pastPapers: true,
              tests: true,
              assignments: true,
              quizzes: true,
              videos: true,
            },
          },
        },
        orderBy: [{ yearNumber: 'asc' }, { code: 'asc' }],
      },
    },
  });
}

// Types for the course exploration result
export interface CourseExplorationResult {
  id: string;
  code: string;
  title: string;
  description: string | null;
  yearNumber: number | null;
  institution: {
    id: string;
    name: string;
    slug: string;
    shortName: string | null;
    logoUrl: string | null;
  };
  programme: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  faculty: {
    name: string;
    code: string;
  } | null;
  tutorSpecialties: Array<{
    role: string;
    tutor: {
      id: string;
      userId: string | null;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    } | null;
  }>;
  lectureSlides: Array<{
    id: string;
    title: string;
    description: string | null;
    fileUrl: string | null;
    embedUrl: string | null;
    isPreview: boolean;
  }>;
  tutorialSheets: Array<{
    id: string;
    title: string;
    url: string;
    number: number;
    isPreview: boolean;
  }>;
  pastPapers: Array<{
    id: string;
    title: string;
    fileUrl: string;
    year: number | null;
    isPreview: boolean;
  }>;
  tests: Array<{
    id: string;
    title: string;
    isPreview: boolean;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    isPreview: boolean;
  }>;
  quizzes: Array<{
    id: string;
    title: string;
    isPreview: boolean;
  }>;
  videos: Array<{
    id: string;
    title: string;
    url: string;
    thumbnail: string | null;
    isPreview: boolean;
  }>;
  _count: {
    lectureSlides: number;
    tutorialSheets: number;
    pastPapers: number;
    tests: number;
    assignments: number;
    quizzes: number;
    videos: number;
  };
  viewerCanAccessFullContent: boolean;
  viewerIsExploring: boolean;
}

/**
 * Get a course for exploration.
 * Returns full content if member, preview content if exploring.
 */
export async function getCourseForExploration(
  institutionSlug: string,
  courseCode: string
): Promise<CourseExplorationResult | null> {
  const access = await getAccessContext();

  // Find the institution first
  const institution = await prisma.institution.findUnique({
    where: { slug: institutionSlug },
    select: { id: true },
  });

  if (!institution) return null;

  // Find the course within this institution's programmes
  const programmes = await prisma.programme.findMany({
    where: { institutionId: institution.id },
    select: { id: true },
  });

  const programmeIds = programmes.map((p) => p.id);
  if (programmeIds.length === 0) return null;

  const courseBase = await prisma.course.findFirst({
    where: {
      code: courseCode,
      programmeId: { in: programmeIds },
    },
    select: { id: true },
  });

  if (!courseBase) return null;

  const isMember = access.canAccessFullContent(institution.id);

  // Fetch the course with either full content or preview content
  const course = await prisma.course.findUnique({
    where: { id: courseBase.id },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      yearNumber: true,
      institution: {
        select: {
          id: true,
          name: true,
          slug: true,
          shortName: true,
          logoUrl: true,
        },
      },
      programme: {
        select: { id: true, name: true, code: true },
      },
      faculty: {
        select: { name: true, code: true },
      },
      tutorSpecialties: {
        select: {
          role: true,
          tutor: {
            select: {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
        },
      },
      // Content — filtered by isMember
      lectureSlides: isMember
        ? { orderBy: { order: 'asc' } }
        : { where: { isPreview: true }, take: 2, orderBy: { order: 'asc' } },

      tutorialSheets: isMember
        ? { orderBy: { number: 'asc' } }
        : { where: { isPreview: true }, take: 2, orderBy: { number: 'asc' } },

      pastPapers: isMember
        ? { orderBy: { createdAt: 'desc' } }
        : { where: { isPreview: true }, take: 1, orderBy: { createdAt: 'desc' } },

      tests: isMember
        ? { orderBy: { createdAt: 'desc' } }
        : { where: { isPreview: true }, take: 1 },

      assignments: isMember
        ? { orderBy: { createdAt: 'asc' } }
        : { where: { isPreview: true }, take: 1 },

      quizzes: isMember
        ? { orderBy: { createdAt: 'desc' } }
        : { where: { isPreview: true }, take: 1 },

      videos: isMember
        ? { orderBy: { createdAt: 'desc' } }
        : { where: { isPreview: true }, take: 1 },

      // Counts for the locked section
      _count: {
        select: {
          lectureSlides: true,
          tutorialSheets: true,
          pastPapers: true,
          tests: true,
          assignments: true,
          quizzes: true,
          videos: true,
        },
      },
    },
  });

  if (!course || !course.institution) return null;

  return {
    ...course,
    viewerCanAccessFullContent: isMember,
    viewerIsExploring: access.isExploring(institution.id),
  };
}

/**
 * Get programme codes for a given institution slug.
 * Used for generating programme links in exploration pages.
 */
export async function getProgrammeCodesForInstitution(institutionSlug: string) {
  const institution = await prisma.institution.findUnique({
    where: { slug: institutionSlug },
    select: {
      programmes: {
        where: { code: { not: null } },
        select: { code: true, name: true },
        orderBy: { name: 'asc' },
      },
    },
  });

  return institution?.programmes ?? [];
}
