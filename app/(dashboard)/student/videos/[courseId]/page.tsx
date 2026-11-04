export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth';
import { getVideosForCourse } from '@/lib/actions/video-course';
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

  // Fetch course and videos via server action (includes IDOR protection)
  let result: Awaited<ReturnType<typeof getVideosForCourse>> = null;
  try {
    result = await getVideosForCourse(courseId);
  } catch (err) {
    console.error('[CourseVideoPage] Failed to fetch course videos:', err);
  }

  // Return 404 if course not found, not published, or belongs to another university
  if (!result) {
    notFound();
  }

  const { course, videos } = result;

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
            {course.code}
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {course.title}
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
