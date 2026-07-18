import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Video, Presentation, FileQuestion, Play, Film } from 'lucide-react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudentLessonPage({ params }: PageProps) {
  const { userId } = await requireAuth(['STUDENT']);
  const { id } = await params;

  // Fetch lesson with all related content
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      video: true,
      slides: true,
      quiz: true,
      module: {
        include: {
          course: {
            include: {
              enrollments: {
                where: { userId },
                select: { id: true, progress: true },
              },
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  const course = lesson.module.course;
  const enrollment = course.enrollments[0];

  // Check if student is enrolled
  if (!enrollment) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Not Enrolled</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          You need to be enrolled in this course to access the lesson.
        </p>
        <Link
          href={`/student/courses/${course.id}`}
          className="inline-block mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Course
        </Link>
      </div>
    );
  }

  // Helper: extract YouTube ID from URL
  function extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([\w-]+)/,
      /(?:youtu\.be\/)([\w-]+)/,
      /(?:youtube\.com\/embed\/)([\w-]+)/,
    ];
    for (const p of patterns) {
      const match = url.match(p);
      if (match) return match[1];
    }
    return null;
  }

  const videoId = lesson.video?.youtubeId || extractYouTubeId(lesson.video?.url || '');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href={`/student/courses/${course.id}`}
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {course.title}
      </Link>

      {/* Lesson Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
            {lesson.module.title}
          </span>
          <span>•</span>
          <span>Lesson {lesson.order + 1}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
          {lesson.title}
        </h1>
        {lesson.description && (
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {lesson.description}
          </p>
        )}
      </div>

      {/* Lesson Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {/* Video Content */}
        {lesson.video && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Video</h2>
            </div>
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
              {videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={lesson.video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              ) : (
                <video controls className="w-full h-full">
                  <source src={lesson.video.url} />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {lesson.video.title}
            </p>
          </div>
        )}

        {/* Slides Content */}
        {lesson.slides && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Presentation className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Lecture Slides</h2>
            </div>
            <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <iframe
                src={lesson.slides.embedUrl}
                title={lesson.slides.title}
                className="absolute top-0 left-0 w-full h-full"
                allowFullScreen
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {lesson.slides.title}
            </p>
          </div>
        )}

        {/* Quiz Content */}
        {lesson.quiz && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FileQuestion className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Quiz</h2>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {lesson.quiz.title}
              </p>
              <Link
                href={`/student/quizzes/${lesson.quiz.id}`}
                className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                Take Quiz
              </Link>
            </div>
          </div>
        )}

        {/* No Content */}
        {!lesson.video && !lesson.slides && !lesson.quiz && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">No content yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              This lesson doesn't have any content attached yet.
            </p>
          </div>
        )}

        {/* Mark as Complete Button */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/enrollments/progress', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    courseId: course.id,
                    lessonId: lesson.id,
                  }),
                });
                if (res.ok) {
                  alert('✅ Progress updated!');
                  window.location.reload();
                }
              } catch (error) {
                console.error('Error updating progress:', error);
              }
            }}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
          >
            Mark as Complete
          </button>
        </div>
      </div>
    </div>
  );
}