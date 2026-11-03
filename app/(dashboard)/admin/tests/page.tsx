// app/(dashboard)/admin/tests/page.tsx
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, FileCheck, ExternalLink, Calendar, Users, Eye } from 'lucide-react';
import DeleteButton from '@/components/DeleteButton';
import { formatDate } from '@/lib/date-format';

export default async function AdminTestsPage() {
  // Auth handled by layout (ADMIN + SUPER_ADMIN)
  let testsData: any[] = [];
  try {
    testsData = await prisma.test.findMany({
      include: {
        creator: {
          select: { name: true, email: true },
        },
        submissions: {
          select: {
            id: true,
            score: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('[AdminTests] Failed to fetch tests:', err);
  }

  const tests = (Array.isArray(testsData) ? testsData : []).map((t) => ({
    ...t,
    createdAt: t.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: t.updatedAt?.toISOString() ?? new Date().toISOString(),
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tests</h1>
          <p className="text-gray-600 dark:text-muted-foreground text-sm">
            Manage all tests (Google Forms)
          </p>
        </div>
        <Link
          href="/admin/tests/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Test
        </Link>
      </div>

      {tests.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-12 text-center">
          <FileCheck className="w-16 h-16 text-gray-300 dark:text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-foreground">
            No tests yet
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Create your first test using Google Forms.
          </p>
          <Link
            href="/admin/tests/create"
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Test
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Max Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tests.map((test) => {
                  const totalSubs = test.submissions.length;
                  const gradedSubs = test.submissions.filter(
                    (s: any) => s.status === 'GRADED'
                  ).length;
                  const pendingSubs = totalSubs - gradedSubs;

                  return (
                    <tr
                      key={test.id}
                      className="hover:bg-muted transition"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-foreground">
                            {test.title}
                          </p>
                          {test.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {test.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {test.maxScore || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {test.dueDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(test.dueDate)}
                          </div>
                        ) : (
                          'No due date'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">{totalSubs}</span>
                            <span className="text-xs text-gray-400">total</span>
                          </div>
                          {totalSubs > 0 && (
                            <div className="flex gap-3 text-xs">
                              <span className="text-green-600 dark:text-green-400">
                                {gradedSubs} graded
                              </span>
                              {pendingSubs > 0 && (
                                <span className="text-yellow-600 dark:text-yellow-400">
                                  {pendingSubs} pending
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3 items-center">
                          <Link
                            href={`/admin/tests/${test.id}/submissions`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Submissions
                          </Link>
                          <span className="text-gray-300 dark:text-muted-foreground">|</span>
                          <Link
                            href={`/admin/tests/${test.id}`}
                            className="text-gray-600 hover:text-gray-800 dark:text-muted-foreground dark:hover:text-gray-200 text-sm"
                          >
                            Edit
                          </Link>
                          {test.formUrl && (
                            <a
                              href={test.formUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-gray-600 dark:text-muted-foreground dark:hover:text-gray-300"
                              title="Open linked form"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <DeleteButton
                            apiUrl={`/api/tests/${test.id}`}
                            itemName={test.title}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}