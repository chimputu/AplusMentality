'use server';

import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/retry';
import { getAccessContext } from '@/lib/auth/exploration';

/**
 * List all universities except the current user's own.
 */
export async function listExplorableUniversities() {
  const access = await getAccessContext();

  return withRetry(
    () => prisma.institution.findMany({
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
    }),
    { attempts: 3, delayMs: 500 }
  );
}

/**
 * Get a university's public profile with programmes + faculties.
 */
export async function getUniversityForExploration(slug: string) {
  const result = await withRetry(
    () => prisma.institution.findUnique({
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
            faculty: { select: { id: true, name: true, code: true } },
            _count: { select: { courses: true } },
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { programmes: true },
        },
      },
    }),
    { attempts: 3, delayMs: 500 }
  );

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
      faculty: { id: string; name: string; code: string } | null;
      _count: { courses: number };
    }>;
    _count: { programmes: number };
  } | null;
}

/**
 * Get a programme with its courses (metadata only, no private content).
 */
export async function getProgrammeForExploration(
  institutionSlug: string,
  programmeCode: string
) {
  let institution: any;
  try {
    institution = await withRetry(
      () => prisma.institution.findUnique({
        where: { slug: institutionSlug },
        select: { id: true },
      }),
      { attempts: 3, delayMs: 500 }
    );
  } catch (err: any) {
    console.error('[exploration] Failed to find institution:', err.message);
    return null;
  }

  if (!institution) return null;

  let result: any;
  try {
    result = await withRetry(
      () => prisma.programme.findFirst({
        where: {
          code: programmeCode,
          institutionId: institution.id,
        },
        select: {
          id: true,
          name: true,
          code: true,
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
      }),
      { attempts: 3, delayMs: 500 }
    );
  } catch (err: any) {
    console.error('[exploration] Failed to find programme:', err.message);
    return null;
  }

  // Explicitly type the result to avoid Prisma type inference issues in builds
  return result as unknown as {
    id: string;
    name: string;
    code: string | null;
    institution: {
      id: string;
      name: string;
      slug: string;
      shortName: string | null;
      logoUrl: string | null;
    };
    faculty: { name: string; code: string } | null;
    courses: Array<{
      id: string;
      code: string;
      title: string;
      description: string | null;
      yearNumber: number | null;
      _count: {
        lectureSlides: number;
        tutorialSheets: number;
        pastPapers: number;
        tests: number;
        assignments: number;
        quizzes: number;
        videos: number;
      };
    }>;
  } | null;
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
  };
  faculty: {
    name: string;
    code: string;
  } | null;
  tutorSpecialties: Array<{
    tutor: {
      id: string;
      userId: string | null;
      fullName: string;
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
  let institution: any;
  try {
    institution = await withRetry(
      () => prisma.institution.findUnique({
        where: { slug: institutionSlug },
        select: { id: true },
      }),
      { attempts: 3, delayMs: 500 }
    );
  } catch (err: any) {
    console.error('[exploration] Failed to find institution:', err.message);
    return null;
  }

  if (!institution) return null;

  // Find the course within this institution's programmes
  let programmes: any[];
  try {
    programmes = await withRetry(
      () => prisma.programme.findMany({
        where: { institutionId: institution.id },
        select: { id: true },
      }),
      { attempts: 3, delayMs: 500 }
    );
  } catch (err: any) {
    console.error('[exploration] Failed to find programmes:', err.message);
    return null;
  }

  const programmeIds = programmes.map((p) => p.id);
  if (programmeIds.length === 0) return null;

  let courseBase: any;
  try {
    courseBase = await withRetry(
      () => prisma.course.findFirst({
        where: {
          code: courseCode,
          programmeId: { in: programmeIds },
        },
        select: { id: true },
      }),
      { attempts: 3, delayMs: 500 }
    );
  } catch (err: any) {
    console.error('[exploration] Failed to find course:', err.message);
    return null;
  }

  if (!courseBase) return null;

  const isMember = access.canAccessFullContent(institution.id);

  // Fetch the course with either full content or preview content
  let course: any;
  try {
    course = await withRetry(
      () => prisma.course.findUnique({
        where: { id: courseBase.id },
        select: {
          id: true,
          code: true,
          title: true,
          description: true,
          yearNumber: true,
          programme: {
            select: {
              id: true,
              name: true,
              code: true,
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
            },
          },
          tutorSpecialties: {
            select: {
              tutor: {
                select: {
                  id: true,
                  userId: true,
                  fullName: true,
                },
              },
            },
          },
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
      }),
      { attempts: 3, delayMs: 500 }
    );
  } catch (err: any) {
    console.error('[exploration] Failed to fetch course details:', err.message);
    return null;
  }

  // Cast to avoid TypeScript union type issues from conditional selects
  const c = course as any;
  if (!c || !c.programme?.institution) return null;

  const prog = c.programme;
  return {
    id: c.id,
    code: c.code,
    title: c.title,
    description: c.description,
    yearNumber: c.yearNumber,
    institution: prog.institution,
    programme: { id: prog.id, name: prog.name, code: prog.code },
    faculty: prog.faculty ?? null,
    tutorSpecialties: c.tutorSpecialties,
    lectureSlides: c.lectureSlides,
    tutorialSheets: c.tutorialSheets,
    pastPapers: c.pastPapers,
    tests: c.tests,
    assignments: c.assignments,
    quizzes: c.quizzes,
    videos: c.videos,
    _count: c._count,
    viewerCanAccessFullContent: isMember,
    viewerIsExploring: access.isExploring(institution.id),
  };
}

/**
 * Get programme codes for a given institution slug.
 * Used for generating programme links in exploration pages.
 */
export async function getProgrammeCodesForInstitution(institutionSlug: string) {
  let institution: any;
  try {
    institution = await withRetry(
      () => prisma.institution.findUnique({
        where: { slug: institutionSlug },
        select: {
          programmes: {
            where: { code: { not: null } },
            select: { code: true, name: true },
            orderBy: { name: 'asc' },
          },
        },
      }),
      { attempts: 3, delayMs: 500 }
    );
  } catch (err: any) {
    console.error('[exploration] Failed to find institution:', err.message);
    return [];
  }

  return institution?.programmes ?? [];
}
