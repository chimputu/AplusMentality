import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, Award, FileCheck, User, Calendar, MessageCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentTestResultsPage({ params }: PageProps) {
  const { userId } = await requireAuth(['STUDENT']);
  const { id } = await params;

  // Fetch test and submission
  const testData = await prisma.test.findUnique({
    where: { id },
    include: {
      creator: {
        select: { name: true },
      },
      submissions: {
        where: { userId },
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!testData || !testData.isPublished) {
    notFound();
  }

  // Convert dates to strings
  const test = {
    ...testData,
    createdAt: testData.createdAt.toISOString(),
    dueDate: testData.dueDate ? testData.dueDate.toISOString() : null,
    submissions: testData.submissions.map((s: any) => ({
      ...s,
      submittedAt: s.submittedAt.toISOString(),
      gradedAt: s.gradedAt ? s.gradedAt.toISOString() : null,
    })),
  };

  const submission = test.submissions[0];

  // If no submission, redirect to the test page
  if (!submission) {
    redirect(`/student/tests/${id}`);
  }

  const isGraded = submission.status === 'GRADED';
  const isPending = submission.status === 'PENDING';
  const isReturned = submission.status === 'RETURNED';

  const scoreDisplay = isGraded || isReturned ? submission.score : '—';
  const totalDisplay = submission.total || '—';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        href="/student/tests"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Tests
      </Link>

      {/* Test info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                Test
              </span>
              {test.maxScore && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Max Score: {test.maxScore}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {test.title}
            </h1>
            {test.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-2">{test.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {test.creator?.name || 'Unknown'}
              </span>
              {test.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Due: {new Date(test.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          Your Results
        </h2>

        {/* Status Badge */}
        <div className="mb-6">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            isGraded || isReturned
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}>
            {isGraded || isReturned ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            {isGraded ? 'Graded' : isReturned ? 'Returned' : 'Pending Review'}
          </div>
        </div>

        {/* Score */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{scoreDisplay}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalDisplay}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Percentage</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isGraded || isReturned
                ? submission.score && submission.total
                  ? Math.round((submission.score / submission.total) * 100) + '%'
                  : '—'
                : '—'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Submitted</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {new Date(submission.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Feedback */}
        {submission.feedback && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
            <div className="flex items-start gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Feedback</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                  {submission.feedback}
                </p>
                {submission.gradedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    Graded on: {new Date(submission.gradedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Review Actions */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-3">
          <Link
            href={`/student/tests/${id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            Review Test
          </Link>
          {test.formUrl && (
            <a
              href={test.formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View Form <ArrowLeft className="w-4 h-4 rotate-180" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}