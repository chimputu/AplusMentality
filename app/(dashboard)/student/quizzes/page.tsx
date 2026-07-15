import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileQuestion, Calendar, User, Clock, CheckCircle, ExternalLink } from 'lucide-react';

export default async function StudentQuizzesPage() {
  const { userId } = await requireAuth(['STUDENT']);

  const quizzesData = await prisma.quiz.findMany({
    where: { isPublished: true },
    include: {
      creator: {
        select: { name: true },
      },
      submissions: {
        where: { userId },
        select: {
          id: true,
          score: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // ✅ Convert Dates to strings
  const quizzes = quizzesData.map((q) => ({
    ...q,
    createdAt: q.createdAt.toISOString(),
    dueDate: q.dueDate ? q.dueDate.toISOString() : null,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quizzes</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Take available quizzes</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FileQuestion className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">No quizzes available</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Check back later for new quizzes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => {
            const hasSubmitted = quiz.submissions.length > 0;
            const submission = quiz.submissions[0];

            return (
              <div
                key={quiz.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          Quiz
                        </span>
                        {quiz.dueDate && (
                          <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due: {new Date(quiz.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-2">
                        {quiz.title}
                      </h3>
                      {quiz.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {quiz.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submission Status */}
                  {hasSubmitted && (
                    <div className="mt-3 flex items-center gap-2">
                      {submission.status === 'GRADED' ? (
                        <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          Score: {submission.score || 0}%
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400">
                          <Clock className="w-4 h-4" />
                          Pending Review
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {quiz.creator?.name || 'Unknown'}
                    </div>
                    <div className="flex gap-2">
                      {hasSubmitted ? (
                        <Link
                          href={`/student/quizzes/${quiz.id}/results`}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View Results
                        </Link>
                      ) : (
                        <Link
                          href={`/student/quizzes/${quiz.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          Take Quiz
                        </Link>
                      )}
                      <a
                        href={quiz.formUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}