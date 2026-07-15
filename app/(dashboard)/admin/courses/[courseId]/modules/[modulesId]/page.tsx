import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, BookOpen, Users, PlayCircle, Calendar } from 'lucide-react';
import ModuleList from '@/components/ModuleList';

interface PageProps {
  params: Promise<{ courseId: string }>;  // ✅ Changed from 'id' to 'courseId'
}

export default async function AdminCourseDetailPage({ params }: PageProps) {
  await requireAuth(['ADMIN']);
  const { courseId } = await params;  // ✅ Changed from 'id' to 'courseId'

  const courseData = await prisma.course.findUnique({
    where: { id: courseId },  // ✅ Use courseId
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              video: true,
              slides: true,
              quiz: true,
            },
          },
        },
      },
      enrollments: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
      creator: {
        select: { name: true, email: true },
      },
    },
  });

  if (!courseData) {
    notFound();
  }

  // Convert dates to strings
  const course = {
    ...courseData,
    createdAt: courseData.createdAt.toISOString(),
    updatedAt: courseData.updatedAt.toISOString(),
    modules: courseData.modules.map((module) => ({
      ...module,
      createdAt: module.createdAt.toISOString(),
      updatedAt: module.updatedAt.toISOString(),
      lessons: module.lessons.map((lesson) => ({
        ...lesson,
        createdAt: lesson.createdAt.toISOString(),
        updatedAt: lesson.updatedAt.toISOString(),
      })),
    })),
    enrollments: courseData.enrollments.map((enrollment) => ({
      ...enrollment,
      enrolledAt: enrollment.enrolledAt.toISOString(),
    })),
  };

  const totalLessons = course.modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0
  );

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                {course.code}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full ${
                course.isPublished
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {course.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
                {course.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/courses/${course.id}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Edit Course
            </Link>
            <Link
              href={`/admin/courses/${course.id}/modules/create`}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Module
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <BookOpen className="w-4 h-4" />
            {course.modules.length} Modules
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <PlayCircle className="w-4 h-4" />
            {totalLessons} Lessons
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            {course.enrollments.length} Students Enrolled
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            Created {new Date(course.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Modules</h2>
        <ModuleList modules={course.modules} courseId={course.id} isAdmin={true} />
      </div>
    </div>
  );
}