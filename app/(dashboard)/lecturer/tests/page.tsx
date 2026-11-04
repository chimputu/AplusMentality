export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileText, Calendar, Clock, Plus } from 'lucide-react';

export default async function LecturerTestsPage() {
  const { userId } = await requireAuth(['LECTURER']);

  let testsData: any[] = [];
  try {
    testsData = await prisma.test.findMany({
      where: { createdBy: userId },
      include: {
        course: {
          select: { code: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('[LecturerTests] Failed to fetch tests:', err);
  }

  const tests = (Array.isArray(testsData) ? testsData : []).map((t: any) => ({
    ...t,
    createdAt: t.createdAt?.toISOString() ?? new Date().toISOString(),
    dueDate: t.dueDate?.toISOString() ?? null,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Tests</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Tests you have created
          </p>
        </div>
        <Link
          href="/admin/tests/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          New Test
        </Link>
      </div>

      {tests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No tests yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Create your first test to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map((test: any) => (
            <div
              key={test.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {test.course && (
                      <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                        {test.course.code}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                    {test.title}
                  </h3>
                  {test.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {test.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(test.createdAt).toLocaleDateString()}
                    </span>
                    {test.timeLimit && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {test.timeLimit} min
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
