import { prisma } from '@/lib/prisma';
import { BookOpen } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import CourseList from '@/components/CourseList';

export default async function AdminCoursesPage() {
  const coursesData = await prisma.course.findMany({
    include: {
      creator: {
        select: { name: true },
      },
      _count: {
        select: {
          modules: true,
          enrollments: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const courses = coursesData.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Manage all your courses"
        action={{
          label: 'Create Course',
          href: '/admin/courses/create',
        }}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {courses.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-10 h-10 text-gray-400 dark:text-gray-500" />}
            title="No courses yet"
            description="Create your first course to get started!"
            action={{
              label: 'Create Course',
              href: '/admin/courses/create',
            }}
          />
        ) : (
          <CourseList courses={courses} isAdmin={true} />
        )}
      </div>
    </div>
  );
}