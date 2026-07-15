'use client';
import Link from 'next/link';
import { BookOpen, GraduationCap, Users, PlayCircle } from 'lucide-react';

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  modules: any[];
  creator: { name: string | null };
}

interface StudentCourseCardProps {
  course: Course;
  isEnrolled?: boolean;
  progress?: number;
}

export default function StudentCourseCard({ 
  course, 
  isEnrolled = false, 
  progress = 0 
}: StudentCourseCardProps) {
  const totalLessons = course.modules.reduce(
    (acc, module) => acc + (module.lessons?.length || 0),
    0
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition group">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
              {course.code}
            </span>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-2 line-clamp-1">
              {course.title}
            </h3>
          </div>
          {isEnrolled && (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              {progress || 0}%
            </span>
          )}
        </div>

        {course.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
            {course.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {course.modules.length} modules
          </span>
          <span className="flex items-center gap-1">
            <PlayCircle className="w-3.5 h-3.5" />
            {totalLessons} lessons
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {course.creator?.name || 'Unknown'}
          </span>
        </div>

        {isEnrolled && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress || 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {progress || 0}% complete
              </span>
              <Link
                href={`/student/courses/${course.id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition flex items-center gap-1"
              >
                Continue Learning →
              </Link>
            </div>
          </div>
        )}

        {!isEnrolled && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <form action="/api/enrollments" method="POST">
              <input type="hidden" name="courseId" value={course.id} />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                Enroll Now
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}