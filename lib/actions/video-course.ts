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
  universityId?: string | null
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
      universityId: true,
      year: true,
      period: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  const where: Record<string, unknown> = {};

  // Non-admins are scoped to their university/year/period
  if (!isAdmin) {
    where.isPublished = true;

    if (user.universityId) {
      where.universityId = user.universityId;
    }

    if (user.year !== null && user.year !== undefined) {
      where.year = user.year;
    }

    if (user.period !== null && user.period !== undefined) {
      where.period = user.period;
    }
  }

  // Optional filter by university (for exploring other universities)
  if (universityId && isAdmin) {
    where.universityId = universityId;
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
      universityId: true,
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
      universityId: true,
      isPublished: true,
    },
  });

  if (!course || !course.isPublished) {
    return null;
  }

  // IDOR check: block if the course belongs to a different university
  if (!isAdmin && user.universityId && course.universityId !== user.universityId) {
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
