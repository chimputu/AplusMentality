import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { getAttemptResult } from '@/lib/actions/attempts';
import Link from 'next/link';
import { ArrowLeft, Award, Clock, CheckCircle, XCircle } from 'lucide-react';

export default async function AssessmentResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ attemptId?: string }>;
}) {
  await requireAuth(['STUDENT']);

  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const attemptId = sp.attemptId;
  if (!attemptId) notFound();

  const data = await getAttemptResult(attemptId).catch(() => null);
  if (!data) notFound();

  const { attempt, assessment, answers, showAnswers } = data;
  const questions = assessment.questions.sort((a: any, b: any) => a.order - b.order);

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const gradeColor =
    attempt.percentage !== null
      ? attempt.percentage >= 80
        ? 'text-green-600 dark:text-green-400'
        : attempt.percentage >= 50
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-red-600 dark:text-red-400'
      : 'text-gray-600 dark:text-gray-400';

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/assessments"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Assessments
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {assessment.title} — Results
      </h1>

      {/* Score card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Score</p>
            <p className={`text-2xl font-bold ${gradeColor}`}>
              {attempt.score ?? '—'}/{attempt.totalPoints ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Percentage</p>
            <p className={`text-2xl font-bold ${gradeColor}`}>
              {attempt.percentage !== null ? `${attempt.percentage.toFixed(1)}%` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
            <p className="flex items-center gap-1 text-sm">
              {attempt.passed ? (
                <span className="text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" /> Passed
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400">
                  <XCircle className="w-4 h-4" /> Failed
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time</p>
            <p className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
              <Clock className="w-4 h-4" />
              {formatTime(attempt.timeSpent)}
            </p>
          </div>
        </div>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Question Breakdown</h2>
        {questions.map((q: any, i: number) => {
          const answer = answers[q.id];
          return (
            <div
              key={q.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {q.prompt}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {q.type.replace(/_/g, ' ')} • {q.points} point{q.points > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {answer && (
                <div className="ml-9 space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Your answer: </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {answer.selectedOptionId
                        ? answer.selectedOptionId
                        : answer.textAnswer
                          ? answer.textAnswer
                          : answer.numericAnswer !== undefined
                            ? answer.numericAnswer
                            : 'No answer'}
                    </span>
                  </div>
                  {showAnswers && q.correctText && (
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Correct answer: </span>
                      <span className="text-green-600 dark:text-green-400">{q.correctText}</span>
                    </div>
                  )}
                  {q.explanation && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                      💡 {q.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
