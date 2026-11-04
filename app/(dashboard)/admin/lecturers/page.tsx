export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import UserManagement from '@/components/UserManagement';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function AdminLecturersPage() {
  const { role: userRole, user: adminUser } = await requireAuth(['ADMIN', 'SUPER_ADMIN']);
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  let usersData: any[] = [];
  let institutionsData: any[] = [];
  try {
    const where: any = { role: 'LECTURER' };

    // Strict tenant isolation: ADMIN can only see lecturers in their own institution
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
    console.error('[AdminLecturers] Failed to fetch lecturers:', err);
  }

  const users = (Array.isArray(usersData) ? usersData : []).map((user) => ({
    ...user,
    createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
    enrollments: (Array.isArray(user.enrollments) ? user.enrollments : []).map((enrollment: any) => ({
      ...enrollment,
      enrolledAt: enrollment.enrolledAt?.toISOString() ?? new Date().toISOString(),
    })),
  }));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lecturers</h1>
          <p className="text-gray-600 dark:text-muted-foreground text-sm">
            {isSuperAdmin
              ? 'Manage all lecturers across all universities'
              : 'Manage lecturers within your university'}
          </p>
        </div>
        <Link
          href="/admin/lecturers/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Lecturer
        </Link>
      </div>
      <UserManagement users={users} institutions={institutionsData} adminRole={userRole} />
    </div>
  );
}
