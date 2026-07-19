import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Video, Presentation, FileQuestion, ArrowRight } from 'lucide-react';

export default async function StudentLessonsPage() {
  await requireAuth(['STUDENT']);

  // Fetch all lessons (you might want to filter by course or module)
  const lessons = await prisma.lesson.findMany({
    include: {
      module: {
        include: {
          course: true,
        },
      },
      video: true,
      slides: true,
      quiz: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">All Lessons</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="border rounded-xl p-4 hover:shadow-md transition bg-white dark:bg-gray-800">
            <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{lesson.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{lesson.module?.course?.title}</p>

            {/* Lesson badges */}
            <div className="mt-2 flex flex-wrap gap-2">
              {lesson.video && (
                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded">
                  <Video className="w-3 h-3 inline mr-1" /> Video
                </span>
              )}
              {/* ✅ FIXED: Only show slides badge if embedUrl exists */}
              {lesson.slides && lesson.slides.embedUrl && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                  <Presentation className="w-3 h-3 inline mr-1" /> Slides
                </span>
              )}
              {lesson.quiz && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded">
                  <FileQuestion className="w-3 h-3 inline mr-1" /> Quiz
                </span>
              )}
            </div>

            {/* ✅ FIXED: Only render slides iframe if embedUrl exists */}
            {lesson.slides && lesson.slides.embedUrl && (
              <div className="mt-3 aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <iframe
                  src={lesson.slides.embedUrl}
                  title={lesson.slides.title || 'Slides'}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            )}

            <Link
              href={`/student/lessons/${lesson.id}`}
              className="mt-3 inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              View Lesson <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}