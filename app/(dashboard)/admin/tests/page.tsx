import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, FileCheck, ExternalLink, Calendar, Users } from 'lucide-react';

export default async function AdminTestsPage() {
  await requireAuth(['ADMIN']);

  const testsData = await prisma.test.findMany({
    include: {
      creator: {
        select: { name: true, email: true },
      },
      submissions: {
        select: {
          id: true,
          score: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // ✅ Convert Dates to strings
  const tests = testsData.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tests</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Manage all tests (Google Forms)</p>
        </div>
        <Link
          href="/admin/tests/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Test
        </Link>
      </div>

      {tests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FileCheck className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">No tests yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create your first test using Google Forms.</p>
          <Link
            href="/admin/tests/create"
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Test
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Max Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Submissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">{test.title}</p>
                        {test.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{test.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {test.maxScore || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {test.dueDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(test.dueDate).toLocaleDateString()}
                        </div>
                      ) : (
                        'No due date'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        {test.submissions.length}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/tests/${test.id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                        >
                          Edit
                        </Link>
                        <a
                          href={test.formUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
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