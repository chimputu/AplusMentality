import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { getStudentAssessments } from '@/lib/actions/attempts';
import { ClipboardCheck, Clock, Award, ArrowRight } from 'lucide-react';

export default async function StudentAssessmentsPage() {
  await requireAuth(['STUDENT']);

  const assessments = await getStudentAssessments();

  const typeColors: Record<string, string> = {
    QUIZ: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    TEST: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    EXAM: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    ASSIGNMENT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    PRACTICE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assessments</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Take quizzes, tests, and assignments
        </p>
      </div>

      {assessments.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No assessments available
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Check back later for new assessments.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assessments.map((a: any) => {
            const status = a.lastAttempt
              ? 'completed'
              : a.attemptsUsed > 0
                ? 'in-progress'
                : 'not-started';

            return (
              <div
                key={a.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      typeColors[a.type] || typeColors.QUIZ
                    }`}
                  >
                    {a.type.replace(/_/g, ' ')}
                  </span>
                  {status === 'completed' && (
                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {a.lastAttempt.percentage?.toFixed(0)}%
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {a.title}
                </h3>
                {a.course && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {a.course.code} — {a.course.title}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <ClipboardCheck className="w-3 h-3" />
                    {a.totalQuestions} questions
                  </span>
                  {a.timeLimit && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {a.timeLimit} min
                    </span>
                  )}
                  <span>
                    {a.attemptsUsed}/{a.attemptsMax} attempts
                  </span>
                </div>

                <Link
                  href={`/assessments/${a.id}`}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {status === 'completed' ? 'View Result' : status === 'in-progress' ? 'Resume' : 'Start'}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
