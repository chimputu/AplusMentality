import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ApplicationTable from './_components/application-table';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Filter,
  CalendarDays,
} from 'lucide-react';
import Link from 'next/link';

interface SearchParams {
  status?: string;
  page?: string;
}

export default async function AdminTutorApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await prisma.user.findUnique({ where: { clerkId: userId! } });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized');
  }

  const params: SearchParams = await (searchParams || Promise.resolve({}));
  const status = params?.status || undefined;
  const page = parseInt(params?.page || '1');

  const skip = (page - 1) * 20;

  const where: any = {};
  if (status) where.status = status;

  let total = 0;
  let applications: any[] = [];
  let counts: any[] = [];
  try {
    [total, applications] = await Promise.all([
      prisma.tutorApplication.count({ where }),
      prisma.tutorApplication.findMany({
        where,
        skip,
        take: 20,
        orderBy: { submittedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
              role: true,
            },
          },
          institution: { select: { id: true, name: true, shortName: true } },
        },
      }),
    ]);
    counts = await prisma.tutorApplication.groupBy({
      by: ['status'],
      _count: { status: true },
    });
  } catch (err) {
    console.error('[AdminTutorApplications] Failed to fetch data:', err);
  }

  const stats = {
    PENDING: 0,
    UNDER_REVIEW: 0,
    APPROVED: 0,
    REJECTED: 0,
    total: 0,
  };
  for (const c of counts) {
    stats[c.status as keyof typeof stats] = c._count.status;
    stats.total += c._count.status;
  }

  const serializedApps: any[] = applications.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    phone: a.phone,
    experienceYears: a.experienceYears,
    cvUrl: a.cvUrl,
    status: a.status,
    adminNotes: a.adminNotes,
    rejectionReason: a.rejectionReason,
    submittedAt: a.submittedAt.toISOString(),
    reviewedAt: a.reviewedAt?.toISOString() || null,
    user: a.user,
    institution: a.institution,
  }));

  const statCards = [
    {
      label: 'Pending',
      count: stats.PENDING,
      icon: Clock,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
      href: '?status=PENDING',
    },
    {
      label: 'Under Review',
      count: stats.UNDER_REVIEW,
      icon: AlertCircle,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      href: '?status=UNDER_REVIEW',
    },
    {
      label: 'Approved',
      count: stats.APPROVED,
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/30',
      href: '?status=APPROVED',
    },
    {
      label: 'Rejected',
      count: stats.REJECTED,
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/30',
      href: '?status=REJECTED',
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Tutor Applications
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Review and manage tutor applications from students.
            </p>
          </div>
          <Link
            href="/admin/tutor-applications/window"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition"
          >
            <CalendarDays className="w-4 h-4" />
            Manage Windows
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`${card.bg} rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {card.count}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.label}
                  </p>
                </div>
                <Icon className={`w-8 h-8 ${card.color}`} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        <Filter className="w-4 h-4 text-gray-500" />
        <Link
          href="?"
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            !status
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All ({stats.total})
        </Link>
        {['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((s) => (
          <Link
            key={s}
            href={`?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              status === s
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {s.replace('_', ' ')} ({(stats as any)[s] || 0})
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        {serializedApps.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>No applications found.</p>
          </div>
        ) : (
          <ApplicationTable
            applications={serializedApps}
            total={total}
          />
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}${status ? `&status=${status}` : ''}`}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          {page < Math.ceil(total / 20) && (
            <Link
              href={`?page=${page + 1}${status ? `&status=${status}` : ''}`}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
