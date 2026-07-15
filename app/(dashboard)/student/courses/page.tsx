import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { BookOpen, GraduationCap, Users, Calendar, PlayCircle } from 'lucide-react';

export default async function StudentCoursesPage() {
  const { userId } = await requireAuth(['STUDENT']);

  // Get enrolled courses
  const enrollmentsData = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: true,
            },
          },
          creator: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  // ✅ Convert dates
  const enrollments = enrollmentsData.map((e) => ({
    ...e,
    enrolledAt: e.enrolledAt.toISOString(),
    course: {
      ...e.course,
      createdAt: e.course.createdAt.toISOString(),
      modules: e.course.modules.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        lessons: m.lessons.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
        })),
      })),
    },
  }));

  // Get available courses
  const availableCoursesData = await prisma.course.findMany({
    where: {
      isPublished: true,
      NOT: {
        enrollments: {
          some: { userId },
        },
      },
    },
    include: {
      modules: {
        include: {
          lessons: true,
        },
      },
      creator: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  // ✅ Convert dates
  const availableCourses = availableCoursesData.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    modules: c.modules.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      lessons: m.lessons.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
    })),
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Courses</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Your enrolled courses and progress</p>
      </div>

      {/* Enrolled Courses */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Enrolled Courses ({enrollments.length})
        </h2>

        {enrollments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">No courses enrolled</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Browse available courses below and start learning!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => {
              const { course } = enrollment;
              const totalLessons = course.modules.reduce(
                (acc, m) => acc + m.lessons.length,
                0
              );

              return (
                <div
                  key={enrollment.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition group"
                >
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
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        {enrollment.progress || 0}%
                      </span>
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
                        {course.creator.name || 'Unknown'}
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${enrollment.progress || 0}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {enrollment.progress || 0}% complete
                        </span>
                        <Link
                          href={`/student/courses/${course.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition flex items-center gap-1"
                        >
                          Continue Learning →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Courses */}
      {availableCourses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Available Courses ({availableCourses.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map((course) => {
              const totalLessons = course.modules.reduce(
                (acc, m) => acc + m.lessons.length,
                0
              );

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition group"
                >
                  <div className="p-6">
                    <div>
                      <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                        {course.code}
                      </span>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-2 line-clamp-1">
                        {course.title}
                      </h3>
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
                        {course.creator.name || 'Unknown'}
                      </span>
                    </div>

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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}