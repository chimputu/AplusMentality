// app/(dashboard)/student/lessons/[id]/page.tsx
import { requireAuth } from '@/lib/auth';
import { getScopeContext, isResourceInScope } from '@/lib/auth/scope';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Video, Presentation, FileQuestion } from 'lucide-react';
import MarkLessonCompleteButton from '@/components/MarkLessonCompleteButton';
import SlideViewerButton from '@/components/SlideViewerButton';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Wraps a PDF URL with Google Docs Viewer for reliable inline display.
 * Works across all browsers — Windows, Mac, Android, iOS.
 */
function getGoogleDocsViewerUrl(fileUrl: string): string {
  const encoded = encodeURIComponent(fileUrl);
  return `https://docs.google.com/viewer?url=${encoded}&embedded=true`;
}

export default async function StudentLessonPage({ params }: PageProps) {
  const { userId } = await requireAuth(['STUDENT']);
  const { id } = await params;

  // SECURITY: Resolve user's academic scope to prevent IDOR
  const scope = await getScopeContext();

  let lesson: any = null;
  try {
    lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        video: true,
        slides: true,
        quiz: true,
        module: {
          include: {
            course: {
              select: { id: true },
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
  } catch (err) {
    console.error('[StudentLesson] Failed to fetch lesson:', err);
  }

  if (!lesson) {
    notFound();
  }

  const course = lesson.module.course;

  // SECURITY: Block if the course is not in the user's scope
  if (!isResourceInScope(scope, course.universityId ?? null)) {
    notFound();
  }

  const enrollment = course.enrollments[0];

  if (!enrollment) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Not Enrolled
        </h2>
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

  // Compute next lesson with error handling
  let courseWithModules: any = null;
  try {
    courseWithModules = await prisma.course.findUnique({
      where: { id: course.id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  } catch (err) {
    console.error('[StudentLesson] Failed to fetch course modules:', err);
  }

  let nextLessonId: string | null = null;

  if (courseWithModules) {
    const modules = courseWithModules.modules;
    const currentModule = modules.find((m: any) => m.id === lesson.moduleId);
    if (currentModule) {
      const lessons = currentModule.lessons;
      const currentIndex = lessons.findIndex((l: any) => l.id === lesson.id);
      if (currentIndex !== -1 && currentIndex + 1 < lessons.length) {
        nextLessonId = lessons[currentIndex + 1].id;
      } else {
        const moduleIndex = modules.findIndex((m: any) => m.id === lesson.moduleId);
        if (moduleIndex !== -1 && moduleIndex + 1 < modules.length) {
          const nextModule = modules[moduleIndex + 1];
          if (nextModule.lessons.length > 0) {
            nextLessonId = nextModule.lessons[0].id;
          }
        }
      }
    }
  }

  // Check completion with error handling
  let completion: any = null;
  try {
    completion = await prisma.lessonCompletion.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId: lesson.id,
        },
      },
    });
  } catch (err) {
    console.error('[StudentLesson] Failed to fetch completion:', err);
  }
  const isCompleted = !!completion;

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

  const videoId =
    lesson.video?.youtubeId || extractYouTubeId(lesson.video?.url || '');

  const hasSlides =
    lesson.slides && (lesson.slides.embedUrl || lesson.slides.fileUrl);

  // ⭐ Compute preview URL for slides — Google Docs Viewer for PDFs
  const slidePreviewUrl = lesson.slides?.embedUrl
    ? lesson.slides.embedUrl
    : lesson.slides?.fileUrl
      ? getGoogleDocsViewerUrl(lesson.slides.fileUrl)
      : '';

  const slideDownloadUrl = lesson.slides?.fileUrl || '';

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
        {/* ============ VIDEO ============ */}
        {lesson.video && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Video
              </h2>
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

        {/* ============ SLIDES ============ */}
        {hasSlides && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Presentation className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Lecture Slides
              </h2>
            </div>

            {/* Preview — Google Slides embed OR Google Docs Viewer */}
            {slidePreviewUrl && (
              <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <iframe
                  src={slidePreviewUrl}
                  title={lesson.slides!.title}
                  className="absolute top-0 left-0 w-full h-full"
                  allowFullScreen
                />
              </div>
            )}

            {/* Action buttons */}
            {lesson.slides!.fileUrl && (
              <div className="flex flex-col sm:flex-row gap-3 mt-3">
                <SlideViewerButton
                  fileUrl={lesson.slides!.fileUrl}
                  title={lesson.slides!.title}
                  fileType={lesson.slides!.contentType}
                />
                <a
                  href={slidePreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 px-5 py-3 sm:py-2 rounded-lg text-sm font-medium transition w-full sm:w-auto"
                >
                  Open in new tab ↗
                </a>
                <a
                  href={slideDownloadUrl}
                  download
                  className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 px-5 py-3 sm:py-2 rounded-lg text-sm font-medium transition w-full sm:w-auto"
                >
                  Download ⬇
                </a>
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {lesson.slides!.title}
            </p>
          </div>
        )}

        {/* ============ QUIZ ============ */}
        {lesson.quiz && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FileQuestion className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Quiz
              </h2>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {lesson.quiz.title}
              </p>
              {lesson.quiz.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {lesson.quiz.description}
                </p>
              )}
              <Link
                href={`/student/quizzes/${lesson.quiz.id}`}
                className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                Take Quiz
              </Link>
            </div>
          </div>
        )}

        {/* ============ NO CONTENT ============ */}
        {!lesson.video && !hasSlides && !lesson.quiz && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              No content yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              This lesson doesn&apos;t have any content attached yet.
            </p>
          </div>
        )}

        {/* ============ MARK COMPLETE ============ */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <MarkLessonCompleteButton
            courseId={course.id}
            lessonId={lesson.id}
            nextLessonId={nextLessonId}
            isCompleted={isCompleted}
          />
        </div>
      </div>
    </div>
  );
}