import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileCheck, Calendar, Users, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default async function LecturerGradesPage() {
  const { userId } = await requireAuth(['LECTURER']);

  let attemptsData: any[] = [];
  try {
    attemptsData = await prisma.assessmentAttempt.findMany({
      where: { assessment: { createdBy: userId } },
      include: {
        user: { select: { name: true, email: true } },
        assessment: { select: { title: true, maxGrade: true, passMark: true } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 50,
    });
  } catch (err) {
    console.error('[LecturerGrades] Failed to fetch attempts:', err);
  }

  const attempts = (Array.isArray(attemptsData) ? attemptsData : []).map((a: any) => ({
    ...a,
    submittedAt: a.submittedAt?.toISOString() ?? new Date().toISOString(),
    user: a.user,
    assessment: a.assessment,
  }));

  // Group by assessment
  const groupedByAssessment: Record<string, any[]> = {};
  for (const attempt of attempts) {
    const key = attempt.assessment?.title || 'Unknown';
    if (!groupedByAssessment[key]) groupedByAssessment[key] = [];
    groupedByAssessment[key].push(attempt);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/lecturer"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Student Grades</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Student submissions for your assessments
        </p>
      </div>

      {attempts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FileCheck className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No submissions yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Student submissions will appear here when they complete your assessments
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByAssessment).map(([assessmentTitle, assessmentAttempts]) => (
            <div key={assessmentTitle}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {assessmentTitle}
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50">
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Percentage
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Submitted
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {assessmentAttempts.map((attempt: any) => {
                        const passMark = attempt.assessment?.passMark ?? 50;
                        const passed = attempt.percentage !== null ? attempt.percentage >= passMark : null;

                        return (
                          <tr key={attempt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                  <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {attempt.user?.name || 'Unknown'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {attempt.user?.email || '-'}
                            </td>
                            <td className="px-6 py-4 text-center text-sm text-gray-900 dark:text-gray-100">
                              {attempt.score !== null
                                ? `${attempt.score}/${attempt.assessment?.maxGrade || '?'}`
                                : '-'}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {attempt.percentage !== null ? (
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {attempt.percentage}%
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">Pending</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {passed === true ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Pass
                                </span>
                              ) : passed === false ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                                  <XCircle className="w-3.5 h-3.5" />
                                  Fail
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center justify-end gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(attempt.submittedAt).toLocaleDateString()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
