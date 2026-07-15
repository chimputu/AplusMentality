import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  BookOpen, 
  Users, 
  PlayCircle, 
  Calendar,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Video,
  Presentation,
  FileQuestion
} from 'lucide-react';
import ModuleList from '@/components/ModuleList';

interface PageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function AdminCourseDetailPage({ params }: PageProps) {
  await requireAuth(['ADMIN']);
  const { courseId } = await params;

  // Fetch course with all related data
  const courseData = await prisma.course.findUnique({
    where: { id: courseId },
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

  // Handle course not found
  if (!courseData) {
    notFound();
  }

  // ✅ Convert dates to strings
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

  // Calculate totals
  const totalLessons = course.modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </Link>

      {/* Course Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
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
              {course.category && (
                <span className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                  {course.category}
                </span>
              )}
              {course.level && (
                <span className={`text-xs px-2.5 py-1 rounded-full ${
                  course.level === 'Beginner' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                  course.level === 'Intermediate' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                  course.level === 'Advanced' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                  'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                }`}>
                  {course.level}
                </span>
              )}
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
                {course.description}
              </p>
            )}

            {/* Creator info */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Created by {course.creator?.name || 'Unknown'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Link
              href={`/admin/courses/${course.id}/edit`}
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              <Edit className="w-4 h-4" />
              Edit Course
            </Link>
            <Link
              href={`/admin/courses/${course.id}/modules/create`}
              className="inline-flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Module
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {course.modules.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Modules</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <PlayCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {totalLessons}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Lessons</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {course.enrollments.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Students</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {new Date(course.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Modules
          </h2>
          <Link
            href={`/admin/courses/${course.id}/modules/create`}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
          >
            <Plus className="w-4 h-4" />
            Add Module
          </Link>
        </div>

        <ModuleList modules={course.modules} courseId={course.id} isAdmin={true} />
      </div>

      {/* Enrollments Section */}
      {course.enrollments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Enrolled Students ({course.enrollments.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Student
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Progress
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Enrolled
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {course.enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                      {enrollment.user.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {enrollment.user.email}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${enrollment.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {enrollment.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}