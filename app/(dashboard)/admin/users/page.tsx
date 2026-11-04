import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import UserManagement from '@/components/UserManagement';

export default async function AdminUsersPage() {
  // Auth handled by layout (ADMIN + SUPER_ADMIN)
  const { role: userRole, user: adminUser } = await requireAuth(['ADMIN', 'SUPER_ADMIN']);
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  let usersData: any[] = [];
  let institutionsData: any[] = [];
  try {
    const where: any = {};

    // Strict tenant isolation: ADMIN can only see users in their own institution
    // SUPER_ADMIN bypasses this and sees all users globally
    if (userRole === 'ADMIN' && adminUser.institutionId) {
      where.institutionId = adminUser.institutionId;
    }

    usersData = await prisma.user.findMany({
      where,
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
    institutionsData = await prisma.university.findMany({
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-gray-600 dark:text-muted-foreground text-sm">
            {isSuperAdmin
              ? 'Manage all platform users across all universities'
              : 'Manage users within your university'}
          </p>
        </div>
        <a
          href="/api/export/students"
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
        >
          Export Students
        </a>
      </div>
      <UserManagement users={users} institutions={institutionsData} adminRole={userRole} />
    </div>
  );
}