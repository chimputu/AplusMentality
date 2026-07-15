import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileQuestion, ExternalLink, Calendar, Users } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default async function AdminQuizzesPage() {
  // ✅ NO AUTH - layout handles it

  const quizzesData = await prisma.quiz.findMany({
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

  const quizzes = quizzesData.map((q) => ({
    ...q,
    createdAt: q.createdAt.toISOString(),
    dueDate: q.dueDate ? q.dueDate.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quizzes"
        description="Manage all quizzes (Google Forms)"
        action={{
          label: 'Create Quiz',
          href: '/admin/quizzes/create',
        }}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {quizzes.length === 0 ? (
          <EmptyState
            icon={<FileQuestion className="w-10 h-10 text-gray-400 dark:text-gray-500" />}
            title="No quizzes yet"
            description="Create your first quiz using Google Forms."
            action={{
              label: 'Create Quiz',
              href: '/admin/quizzes/create',
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Submissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">{quiz.title}</p>
                        {quiz.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{quiz.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {quiz.dueDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(quiz.dueDate).toLocaleDateString()}
                        </div>
                      ) : (
                        'No due date'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        {quiz.submissions.length}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        quiz.isPublished
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {quiz.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/quizzes/${quiz.id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                        >
                          Edit
                        </Link>
                        <a
                          href={quiz.formUrl}
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
        )}
      </div>
    </div>
  );
}