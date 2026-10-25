import { requireAuth } from '@/lib/auth';
import { getScopeContext, isResourceInScope } from '@/lib/auth/scope';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Video } from 'lucide-react';
import StudentVideoList from '@/components/StudentVideoList';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseVideoPage({ params }: PageProps) {
  await requireAuth(['STUDENT']);
  const { courseId } = await params;

  // SECURITY: Resolve user's academic scope for IDOR protection
  const scope = await getScopeContext();

  // Fetch the course and verify it exists and is published
  let courseData: any = null;
  try {
    courseData = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        code: true,
        title: true,
        universityId: true,
        isPublished: true,
      },
    });
  } catch (err) {
    console.error('[CourseVideoPage] Failed to fetch course:', err);
  }

  if (!courseData || !courseData.isPublished) {
    notFound();
  }

  // SECURITY: Block if the course is not in the user's university scope
  if (!isResourceInScope(scope, courseData.universityId ?? null)) {
    notFound();
  }

  // Fetch all videos for this course
  let videosData: any[] = [];
  try {
    videosData = await prisma.video.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        uploader: { select: { name: true } },
      },
    });
  } catch (err) {
    console.error('[CourseVideoPage] Failed to fetch videos:', err);
  }

  // Convert DateTime fields to ISO strings for JSON serialization
  const videos = (Array.isArray(videosData) ? videosData : []).map((v: any) => ({
    ...v,
    createdAt: v.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href="/student/videos"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Videos
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
            {courseData.code}
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {courseData.title}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          {videos.length} {videos.length === 1 ? 'video' : 'videos'} available
        </p>
      </div>

      {videos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Video className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No videos yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Check back later for video content for this course.
          </p>
        </div>
      ) : (
        <StudentVideoList videos={videos} />
      )}
    </div>
  );
}
