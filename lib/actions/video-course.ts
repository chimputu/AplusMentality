'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Fetch all unique courses that have at least 1 video, scoped STRICTLY to the
 * user's university (orgId), programme, and year.
 *
 * Returns courses with video counts for the course directory page.
 */
export async function getCoursesWithVideos(
  searchQuery?: string,
  institutionId?: string | null
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      role: true,
      institutionId: true,
      year: true,
      period: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  const where: Record<string, unknown> = {};

  // Tenant isolation: ADMIN can only see courses in their own institution
  if (user.role === 'ADMIN' && user.institutionId) {
    where.programme = {
      institutionId: user.institutionId,
    };
  }

  // Non-admins are scoped to their institution/year/period
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    where.isPublished = true;

    if (user.institutionId) {
      where.programme = {
        institutionId: user.institutionId,
      };
    }

    if (user.year !== null && user.year !== undefined) {
      where.year = user.year;
    }

    if (user.period !== null && user.period !== undefined) {
      where.period = user.period;
    }
  }

  // Optional filter by institution (SUPER_ADMIN only, not ADMIN)
  if (institutionId && user.role === 'SUPER_ADMIN') {
    where.programme = {
      institutionId,
    };
  }

  // Search filter
  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { code: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  // Only courses with at least one video
  where.videos = { some: {} };

  const courses = await prisma.course.findMany({
    where,
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      thumbnail: true,
      _count: { select: { videos: true } },
    },
    orderBy: { title: 'asc' },
  });

  return courses;
}

/**
 * Fetch all videos for a specific course, with IDOR protection.
 *
 * Verifies that the courseId belongs to the user's university (organization).
 * Returns 404 if the course belongs to a different university.
 */
export async function getVideosForCourse(courseId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      role: true,
      institutionId: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  // Fetch the course and verify it exists and is published
  const course = await prisma.course.findUnique({
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

  if (!course || !course.isPublished) {
    return null;
  }

  // IDOR check: ADMIN can only access videos from their own institution
  if (user.role === 'ADMIN' && user.institutionId && course.programme?.institutionId !== user.institutionId) {
    return null;
  }
  // Non-admins are also blocked from cross-institution access
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.institutionId && course.programme?.institutionId !== user.institutionId) {
    return null;
  }

  // Fetch all videos for this course
  const videos = await prisma.video.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: {
      uploader: { select: { name: true } },
    },
  });

  return {
    course: {
      id: course.id,
      code: course.code,
      title: course.title,
    },
    videos: videos.map((v) => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    })),
  };
}
