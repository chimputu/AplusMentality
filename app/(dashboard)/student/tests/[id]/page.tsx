import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, FileCheck } from 'lucide-react';
import TestSubmitButton from '@/components/TestSubmitButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentTakeTestPage({ params }: PageProps) {
  const { userId } = await requireAuth(['STUDENT']);
  const { id } = await params;

  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true } },
      submissions: {
        where: { userId },
        select: { id: true, score: true, status: true, submittedAt: true },
      },
    },
  });

  if (!test || !test.isPublished) {
    notFound();
  }

  const hasSubmitted = test.submissions.length > 0;

  if (hasSubmitted) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          You have already submitted this test
        </h2>
        <Link
          href={`/student/tests/${id}/results`}
          className="inline-block mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View Results →
        </Link>
      </div>
    );
  }

  const isExpired = test.dueDate && new Date(test.dueDate) < new Date();
  const isGoogleForm = !!(
    test.contentType === 'google_form' ||
    (!test.contentType && test.embedUrl)
  );
  const isPDF = test.contentType === 'pdf';
  const isImage = test.contentType === 'image';
  const isPastPaper = test.contentType === 'past_paper';  // ✅ NEW

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/student/tests"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Tests
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{test.title}</h1>
        {test.description && (
          <p className="text-gray-600 dark:text-gray-300 mt-2">{test.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
          <span>Created by {test.creator?.name || 'Unknown'}</span>
          {test.maxScore && <span>Max Score: {test.maxScore}</span>}
          {test.dueDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> Due: {new Date(test.dueDate).toLocaleString()}
            </span>
          )}
          {isExpired && <span className="text-red-500 font-medium">Expired</span>}
        </div>
      </div>

      {isExpired ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 text-center">
          <p className="text-yellow-700 dark:text-yellow-400">This test is no longer available.</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Test</h2>
            <div className="aspect-video w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              {isGoogleForm && <iframe src={test.embedUrl} className="w-full h-full" allowFullScreen />}
              {isPDF && test.fileUrl && <iframe src={test.fileUrl} className="w-full h-full" />}
              {isImage && test.fileUrl && <img src={test.fileUrl} alt={test.title} className="w-full h-full object-contain" />}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
              {isGoogleForm
                ? 'Complete the test above, then click the button below to submit.'
                : 'Review the content above, then click the button below to submit.'}
            </p>
          </div>

          {!isPastPaper && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <TestSubmitButton
                testId={test.id}
                formUrl={test.formUrl || ''}
                isGoogleForm={isGoogleForm}
              />
            </div>
          )}
          {isPastPaper && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
              <p className="text-blue-700 dark:text-blue-300 font-medium">
                📄 This is a past paper. Use it for revision.
              </p>
              {test.fileUrl && (
                <a
                  href={test.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  📥 Open Past Paper
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}