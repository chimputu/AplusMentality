import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import UserManagement from '@/components/UserManagement';

export default async function AdminUsersPage() {
  // Auth handled by layout (ADMIN + SUPER_ADMIN)
  let usersData: any[] = [];
  let institutionsData: any[] = [];
  try {
    usersData = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
        programme: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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
    institutionsData = await prisma.institution.findMany({
      where: { isActive: true },
      select: { id: true, name: true, shortName: true },
      orderBy: { name: 'asc' },
    });
  } catch (err) {
    console.error('[AdminUsers] Failed to fetch users:', err);
  }

  // ✅ Convert Date to string for user (NOT enrolledAt - it's nested)
  const users = (Array.isArray(usersData) ? usersData : []).map((user) => ({
    ...user,
    createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
    // ✅ Only convert top-level dates
    // enrolledAt is inside enrollments, not on user directly
    enrollments: (Array.isArray(user.enrollments) ? user.enrollments : []).map((enrollment: any) => ({
      ...enrollment,
      enrolledAt: enrollment.enrolledAt?.toISOString() ?? new Date().toISOString(),
    })),
  }));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Manage users, assign roles, update institutions, and promote students to admins
        </p>
      </div>
      <UserManagement users={users} institutions={institutionsData} />
    </div>
  );
}