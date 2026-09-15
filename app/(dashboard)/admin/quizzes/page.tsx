// app/(dashboard)/admin/quizzes/page.tsx
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, FileQuestion, ExternalLink, Calendar, Users, Eye } from 'lucide-react';
import DeleteButton from '@/components/DeleteButton';

export default async function AdminQuizzesPage() {
  await requireAuth(['ADMIN']);

  const quizzesData = await prisma.quiz.findMany({
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

  const quizzes = quizzesData.map((q) => ({
    ...q,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    dueDate: q.dueDate ? q.dueDate.toISOString() : null,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quizzes</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Manage all quizzes (Google Forms)
          </p>
        </div>
        <Link
          href="/admin/quizzes/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Quiz
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FileQuestion className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No quizzes yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Create your first quiz using Google Forms.
          </p>
          <Link
            href="/admin/quizzes/create"
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Quiz
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {quizzes.map((quiz) => {
                  const totalSubs = quiz.submissions.length;
                  const gradedSubs = quiz.submissions.filter(
                    (s) => s.status === 'GRADED'
                  ).length;
                  const pendingSubs = totalSubs - gradedSubs;

                  return (
                    <tr
                      key={quiz.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {quiz.title}
                          </p>
                          {quiz.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                              {quiz.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {quiz.dueDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(quiz.dueDate).toLocaleDateString('en-GB')}
                          </div>
                        ) : (
                          'No due date'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
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
                            href={`/admin/quizzes/${quiz.id}/submissions`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Submissions
                          </Link>
                          <span className="text-gray-300 dark:text-gray-600">|</span>
                          <Link
                            href={`/admin/quizzes/${quiz.id}`}
                            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                          >
                            Edit
                          </Link>
                          {quiz.formUrl && (
                            <a
                              href={quiz.formUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                              title="Open linked form"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <DeleteButton
                            apiUrl={`/api/quizzes/${quiz.id}`}
                            itemName={quiz.title}
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