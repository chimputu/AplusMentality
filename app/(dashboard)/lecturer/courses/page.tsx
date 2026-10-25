import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { BookOpen, Users, PlayCircle, Plus } from 'lucide-react';

export default async function LecturerCoursesPage() {
  const { userId } = await requireAuth(['LECTURER']);

  let coursesData: any[] = [];
  try {
    coursesData = await prisma.course.findMany({
      where: { createdBy: userId },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('[LecturerCourses] Failed to fetch courses:', err);
  }

  const courses = (Array.isArray(coursesData) ? coursesData : []).map((c: any) => ({
    ...c,
    createdAt: c.createdAt?.toISOString() ?? new Date().toISOString(),
    modules: (Array.isArray(c.modules) ? c.modules : []).map((m: any) => ({
      ...m,
      createdAt: m.createdAt?.toISOString() ?? new Date().toISOString(),
      lessons: (Array.isArray(m.lessons) ? m.lessons : []).map((l: any) => ({
        ...l,
        createdAt: l.createdAt?.toISOString() ?? new Date().toISOString(),
      })),
    })),
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Courses</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Courses you have created
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No courses yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Create your first course to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const totalLessons = course.modules.reduce(
              (acc: number, m: any) => acc + m.lessons.length,
              0
            );

            return (
              <div
                key={course.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition"
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
                      {course._count?.enrollments || 0} enrolled
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <span className={`text-xs font-medium ${course.isPublished ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
