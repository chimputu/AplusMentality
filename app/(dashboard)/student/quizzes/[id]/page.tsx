// app/(dashboard)/student/quizzes/[id]/page.tsx
import { requireAuth } from '@/lib/auth';
import { getScopeContext, isResourceInScope } from '@/lib/auth/scope';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, FileQuestion, ExternalLink, Download } from 'lucide-react';
import QuizSubmitButton from '@/components/QuizSubmitButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Wraps a PDF URL with Google Docs Viewer for reliable inline display.
 * Works across all browsers — Windows, Mac, Android, iOS.
 */
function getGoogleDocsViewerUrl(fileUrl: string): string {
  const encoded = encodeURIComponent(fileUrl);
  return `https://docs.google.com/viewer?url=${encoded}&embedded=true`;
}

export default async function StudentTakeQuizPage({ params }: PageProps) {
  const { userId } = await requireAuth(['STUDENT']);
  const { id } = await params;

  // SECURITY: Resolve user's academic scope to prevent IDOR
  const scope = await getScopeContext();

  let quiz: any = null;
  try {
    quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: { select: { programme: { select: { institutionId: true } } } },
        creator: { select: { name: true } },
        submissions: {
          where: { userId },
          select: { id: true, score: true, status: true, submittedAt: true },
        },
      },
    });
  } catch (err) {
    console.error('[StudentTakeQuiz] Failed to fetch quiz:', err);
  }

  if (!quiz || !quiz.isPublished) {
    notFound();
  }

  // SECURITY: Block if the quiz's course is not in the user's scope
  if (!isResourceInScope(scope, quiz.course?.programme?.institutionId ?? null)) {
    notFound();
  }

  const hasSubmitted = quiz.submissions.length > 0;

  if (hasSubmitted) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <FileQuestion className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          You have already submitted this quiz
        </h2>
        <Link
          href={`/student/quizzes/${id}/results`}
          className="inline-block mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View Results →
        </Link>
      </div>
    );
  }

  const isExpired = quiz.dueDate && new Date(quiz.dueDate) < new Date();
  const isGoogleForm = !!(
    quiz.contentType === 'google_form' ||
    (!quiz.contentType && quiz.embedUrl)
  );
  const isPDF = quiz.contentType === 'pdf';
  const isImage = quiz.contentType === 'image';
  const isPastPaper = quiz.contentType === 'past_paper';

  // ⭐ Compute PDF preview URL via Google Docs Viewer
  const pdfPreviewUrl =
    isPDF && quiz.fileUrl ? getGoogleDocsViewerUrl(quiz.fileUrl) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/student/quizzes"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Quizzes
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-gray-600 dark:text-gray-300 mt-2">{quiz.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
          <span>Created by {quiz.creator?.name || 'Unknown'}</span>
          {quiz.dueDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> Due: {new Date(quiz.dueDate).toLocaleString()}
            </span>
          )}
          {isExpired && <span className="text-red-500 font-medium">Expired</span>}
        </div>
      </div>

      {isExpired ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 text-center">
          <p className="text-yellow-700 dark:text-yellow-400">This quiz is no longer available.</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Quiz</h2>
            <div className="aspect-video w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              {/* Google Form embed */}
              {isGoogleForm && quiz.embedUrl && (
                <iframe
                  src={quiz.embedUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title={quiz.title}
                />
              )}

              {/* PDF via Google Docs Viewer */}
              {isPDF && pdfPreviewUrl && (
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-full"
                  title={quiz.title}
                />
              )}

              {/* Image */}
              {isImage && quiz.fileUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={quiz.fileUrl}
                  alt={quiz.title}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* PDF action buttons */}
            {isPDF && quiz.fileUrl && (
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <a
                  href={getGoogleDocsViewerUrl(quiz.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 sm:py-2 rounded-lg text-sm font-medium transition w-full sm:w-auto"
                >
                  <ExternalLink className="w-4 h-4" /> Open in new tab
                </a>
                <a
                  href={quiz.fileUrl}
                  download
                  className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 px-5 py-3 sm:py-2 rounded-lg text-sm font-medium transition w-full sm:w-auto"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
              {isGoogleForm
                ? 'Complete the quiz above, then click the button below to submit.'
                : 'Review the content above, then click the button below to submit.'}
            </p>
          </div>

          {!isPastPaper && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <QuizSubmitButton
                quizId={quiz.id}
                formUrl={quiz.formUrl || ''}
                isGoogleForm={isGoogleForm}
              />
            </div>
          )}
          {isPastPaper && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
              <p className="text-blue-700 dark:text-blue-300 font-medium">
                📄 This is a past paper. Use it for revision.
              </p>
              {quiz.fileUrl && (
                <a
                  href={getGoogleDocsViewerUrl(quiz.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  📖 Open Past Paper
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}