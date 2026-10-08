import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, User } from 'lucide-react';

export default async function GradingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth(['ADMIN', 'SUPER_ADMIN']);

  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      questions: {
        where: { type: 'ESSAY' },
        orderBy: { order: 'asc' },
      },
      attempts: {
        where: { submittedAt: { not: null } },
        include: {
          user: { select: { firstName: true, email: true } },
        },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });

  if (!assessment) notFound();

  const essayQuestions = assessment.questions;
  const attempts = assessment.attempts;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/assessments"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Grade: {assessment.title}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Submissions</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{attempts.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Essay Questions</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{essayQuestions.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Score</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {attempts.length > 0
              ? `${(attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempts.length).toFixed(1)}%`
              : '—'}
          </p>
        </div>
      </div>

      {/* Attempts list */}
      {attempts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No submissions yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Submissions will appear here when students complete the assessment.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Student
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Score
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Percentage
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Submitted
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {attempts.map((attempt: any) => (
                  <tr key={attempt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {attempt.user.firstName || 'Student'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {attempt.user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {attempt.score ?? '—'}/{attempt.totalPoints ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-medium ${
                          attempt.percentage !== null
                            ? attempt.percentage >= 50
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                            : 'text-gray-500'
                        }`}
                      >
                        {attempt.percentage !== null ? `${attempt.percentage.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        {attempt.submittedAt
                          ? new Date(attempt.submittedAt).toLocaleDateString()
                          : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {attempt.passed !== null ? (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            attempt.passed
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}
                        >
                          <CheckCircle className="w-3 h-3" />
                          {attempt.passed ? 'Passed' : 'Failed'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Essay grading section */}
      {essayQuestions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Essay Questions
          </h2>
          <div className="space-y-4">
            {essayQuestions.map((q: any, i: number) => (
              <div
                key={q.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {i + 1}. {q.prompt}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Max points: {q.points} • Requires manual grading
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Note: Essay grading integration with individual student answers will be added in a future update.
          </p>
        </div>
      )}
    </div>
  );
}
