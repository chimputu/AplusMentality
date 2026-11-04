'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Allowed category slugs and their corresponding Prisma models
const CATEGORY_MAP: Record<string, string> = {
  slides: 'LectureSlide',
  videos: 'Video',
  'past-papers': 'PastPaper',
  tutorials: 'TutorialSheet',
};

const VALID_CATEGORIES = Object.keys(CATEGORY_MAP);

function isValidCategory(category: string): boolean {
  return VALID_CATEGORIES.includes(category);
}

/**
 * Fetch all unique courses that have at least 1 material of the given type,
 * scoped STRICTLY to the user's university, year, and period.
 *
 * Returns courses with material counts for the course directory page.
 */
export async function getCoursesWithMaterials(
  category: string,
  searchQuery?: string
) {
  if (!isValidCategory(category)) {
    return [];
  }

  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error('Unauthorized');
  }

  let user: any;
  try {
    user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        role: true,
        institutionId: true,
        year: true,
        period: true,
      },
    });
  } catch (err) {
    console.error('[getCoursesWithMaterials] Failed to fetch user:', err);
    return [];
  }

  if (!user) {
    throw new Error('User not found');
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  const courseWhere: Record<string, unknown> = {};

  // Tenant isolation: ADMIN can only see courses in their own institution
  if (user.role === 'ADMIN' && user.institutionId) {
    courseWhere.programme = {
      institutionId: user.institutionId,
    };
  }

  // Non-admins are scoped to their institution/year/period
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    courseWhere.isPublished = true;

    if (user.institutionId) {
      courseWhere.programme = {
        institutionId: user.institutionId,
      };
    }

    if (user.year !== null && user.year !== undefined) {
      courseWhere.year = user.year;
    }

    if (user.period !== null && user.period !== undefined) {
      courseWhere.period = user.period;
    }
  }

  // Search filter
  if (searchQuery) {
    courseWhere.OR = [
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { code: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  // Map category to the Prisma relation name for "has materials" check
  const relationMap: Record<string, string> = {
    slides: 'lectureSlides',
    videos: 'videos',
    'past-papers': 'pastPapers',
    tutorials: 'tutorialSheets',
  };

  const relationName = relationMap[category];
  if (relationName) {
    courseWhere[relationName] = { some: {} };
  }

  // Count field name for each category
  const countFieldMap: Record<string, string> = {
    slides: 'lectureSlides',
    videos: 'videos',
    'past-papers': 'pastPapers',
    tutorials: 'tutorialSheets',
  };

  const countField = countFieldMap[category];

  let courses: any[] = [];
  try {
    courses = await prisma.course.findMany({
      where: courseWhere,
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        thumbnail: true,
        _count: { select: { [countField]: true } },
      },
      orderBy: { title: 'asc' },
    });
  } catch (err) {
    console.error('[getCoursesWithMaterials] Failed to fetch courses:', err);
    return [];
  }

  return courses;
}

/**
 * Fetch all materials of a given type for a specific course, with IDOR protection.
 *
 * Verifies that the courseId belongs to the user's university (organization).
 * Returns null if the course belongs to a different university or is not found.
 */
export async function getMaterialsForCourse(category: string, courseId: string) {
  if (!isValidCategory(category)) {
    return null;
  }

  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error('Unauthorized');
  }

  let user: any;
  try {
    user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        role: true,
        institutionId: true,
      },
    });
  } catch (err) {
    console.error('[getMaterialsForCourse] Failed to fetch user:', err);
    return null;
  }

  if (!user) {
    throw new Error('User not found');
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  // Fetch the course and verify it exists and is published
  let course: any;
  try {
    course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        code: true,
        title: true,
        isPublished: true,
        programme: {
          select: {
            institutionId: true,
          },
        },
      },
    });
  } catch (err) {
    console.error('[getMaterialsForCourse] Failed to fetch course:', err);
    return null;
  }

  if (!course || !course.isPublished) {
    return null;
  }

  // IDOR check: ADMIN can only access materials from their own institution
  if (user.role === 'ADMIN' && user.institutionId && course.programme?.institutionId !== user.institutionId) {
    return null;
  }
  // Non-admins are also blocked from cross-institution access
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.institutionId && course.programme?.institutionId !== user.institutionId) {
    return null;
  }

  // Fetch materials based on category type
  let materials: any[] = [];

  try {
    if (category === 'slides') {
      materials = await prisma.lectureSlide.findMany({
        where: { courseId },
        orderBy: { order: 'asc' },
      });
    } else if (category === 'videos') {
      materials = await prisma.video.findMany({
        where: { courseId },
        orderBy: { order: 'asc' },
        include: {
          uploader: { select: { name: true } },
        },
      });
    } else if (category === 'past-papers') {
      materials = await prisma.pastPaper.findMany({
        where: { courseId },
        orderBy: { createdAt: 'desc' },
      });
    } else if (category === 'tutorials') {
      materials = await prisma.tutorialSheet.findMany({
        where: { courseId },
        orderBy: { number: 'asc' },
      });
    }
  } catch (err) {
    console.error('[getMaterialsForCourse] Failed to fetch materials:', err);
    // Return empty array on DB failure — page will show empty state
    materials = [];
  }

  // Serialize dates for client-side rendering
  const serializedMaterials = materials.map((m) => ({
    ...m,
    createdAt: m.createdAt?.toISOString(),
    updatedAt: m.updatedAt?.toISOString(),
  }));

  return {
    course: {
      id: course.id,
      code: course.code,
      title: course.title,
    },
    materials: serializedMaterials,
  };
}
