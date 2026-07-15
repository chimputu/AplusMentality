import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import UserManagement from '@/components/UserManagement';

export default async function AdminUsersPage() {
  await requireAuth(['ADMIN']);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      enrollments: {
        include: {
          course: {
            select: {
              title: true,
            },
          },
        },
      },
      courses: {
        select: {
          title: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
          courses: true,
          announcements: true,
          videos: true,
          quizzes: true,
          tests: true,
          assignments: true,
        },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Manage users, assign roles, and promote students to admins
        </p>
      </div>
      <UserManagement users={users} />
    </div>
  );
}