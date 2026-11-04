import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { BookOpen } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import CourseList from '@/components/CourseList';

export default async function AdminCoursesPage() {
  const { role, user } = await requireAuth(['ADMIN', 'SUPER_ADMIN']);

  let coursesData: any[] = [];
  try {
    const where: any = {};
    // Tenant isolation: ADMIN can only see courses in their own institution
    if (role === 'ADMIN' && user.institutionId) {
      where.programme = { institutionId: user.institutionId };
    }
    coursesData = await prisma.course.findMany({
      where,
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
  } catch (err) {
    console.error('[AdminCourses] Failed to fetch courses:', err);
  }

  const courses = (Array.isArray(coursesData) ? coursesData : []).map((c) => ({
    ...c,
    createdAt: c.createdAt?.toISOString() ?? new Date().toISOString(),
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

      <div className="bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border p-6">
        {courses.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-10 h-10 text-gray-400 dark:text-muted-foreground" />}
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