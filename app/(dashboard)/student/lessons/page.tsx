'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Video, Presentation, FileQuestion, ArrowRight, Building2 } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  module: {
    course: {
      id: string;
      code: string;
      title: string;
      programme: { institution: { id: string; name: string } | null } | null;
    } | null;
  } | null;
  video: { id: string; title: string } | null;
  slides: { id: string; title: string; embedUrl: string | null } | null;
  quiz: { id: string; title: string } | null;
}

export default function StudentLessonsPage() {
  const searchParams = useSearchParams();
  const universityFilter = searchParams.get('university') || '';
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (universityFilter) params.set('university', universityFilter);
    fetch(`/api/lessons${params.toString() ? '?' + params.toString() : ''}`)
      .then((res) => res.json())
      .then((data: Lesson[]) => {
        setLessons(data);
        setLoading(false);
      })
      .catch(() => {
        setLessons([]);
        setLoading(false);
      });
  }, [universityFilter]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Lessons</h1>
        {universityFilter && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Filtering by selected university
          </p>
        )}
      </div>
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading lessons...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              No lessons found.
            </div>
          ) : (
            lessons.map((lesson) => (
              <div key={lesson.id} className="border rounded-xl p-4 hover:shadow-md transition bg-white dark:bg-gray-800">
                <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{lesson.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{lesson.module?.course?.title}</p>
                {lesson.module?.course?.programme?.institution && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                    <Building2 className="w-3 h-3" />
                    {lesson.module.course.programme.institution.name}
                  </div>
                )}

                {/* Lesson badges */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {lesson.video && (
                    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded">
                      <Video className="w-3 h-3 inline mr-1" /> Video
                    </span>
                  )}
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
            ))
          )}
        </div>
      )}
    </div>
  );
}