import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, Award, AlertTriangle } from 'lucide-react';

export default async function AnalyticsPage({
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
        orderBy: { order: 'asc' },
        include: {
          answers: {
            select: {
              id: true,
              isCorrect: true,
              pointsEarned: true,
              attempt: {
                select: {
                  user: { select: { firstName: true } },
                },
              },
            },
          },
        },
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

  const attempts = assessment.attempts;
  const totalAttempts = attempts.length;
  const uniqueStudents = new Set(attempts.map((a: any) => a.userId)).size;

  const scores = attempts
    .map((a: any) => a.percentage)
    .filter((p: any) => p !== null) as number[];

  const avgScore = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
  const medianScore =
    scores.length > 0
      ? scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)]
      : 0;

  // Score distribution buckets
  const buckets = [
    { label: '0-20%', min: 0, max: 20, count: 0 },
    { label: '21-40%', min: 21, max: 40, count: 0 },
    { label: '41-60%', min: 41, max: 60, count: 0 },
    { label: '61-80%', min: 61, max: 80, count: 0 },
    { label: '81-100%', min: 81, max: 100, count: 0 },
  ];
  scores.forEach((s) => {
    const bucket = buckets.find((b) => s >= b.min && s <= b.max);
    if (bucket) bucket.count++;
  });
  const maxBucketCount = Math.max(...buckets.map((b) => b.count), 1);

  // Per-question stats
  const questionStats = assessment.questions.map((q: any) => {
    const answers = q.answers || [];
    const totalAnswered = answers.length;
    const correctCount = answers.filter((a: any) => a.isCorrect === true).length;
    const avgPoints =
      answers.length > 0
        ? answers.reduce((s: number, a: any) => s + (a.pointsEarned || 0), 0) / answers.length
        : 0;
    const pctCorrect = totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;
    const isDifficult = pctCorrect < 40 && totalAnswered > 0;

    return {
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      points: q.points,
      totalAnswered,
      correctCount,
      pctCorrect,
      avgPoints,
      isDifficult,
    };
  });

  const avgTimeSpent =
    attempts.length > 0
      ? Math.round(
          attempts.reduce((s: number, a: any) => s + (a.timeSpent || 0), 0) / attempts.length
        )
      : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

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
          Analytics: {assessment.title}
        </h1>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Students</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{uniqueStudents}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Attempts</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalAttempts}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Score</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {avgScore.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Median</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {medianScore.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Score distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Score Distribution
        </h2>
        <div className="space-y-2">
          {buckets.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right">
                {b.label}
              </span>
              <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded transition-all"
                  style={{
                    width: `${maxBucketCount > 0 ? (b.count / maxBucketCount) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 w-8">
                {b.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-question stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Per-Question Difficulty
        </h2>
        {questionStats.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No questions in this assessment.
          </p>
        ) : (
          <div className="space-y-3">
            {questionStats.map((qs, i) => (
              <div
                key={qs.id}
                className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {qs.prompt}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {qs.type.replace(/_/g, ' ')} • {qs.points} pts • {qs.totalAnswered} answered
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {qs.pctCorrect.toFixed(0)}% correct
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Avg: {qs.avgPoints.toFixed(1)}/{qs.points}
                    </p>
                  </div>
                  {qs.isDifficult && (
                    <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400" title="Difficult question">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attempts table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            All Attempts
          </h2>
        </div>
        {attempts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No attempts yet.</p>
          </div>
        ) : (
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
                    Time
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {attempts.map((attempt: any) => (
                  <tr key={attempt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {attempt.user.firstName || 'Student'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {attempt.percentage !== null ? `${attempt.percentage.toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {attempt.timeSpent ? formatTime(attempt.timeSpent) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {attempt.passed !== null ? (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            attempt.passed
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}
                        >
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
        )}
      </div>
    </div>
  );
}
