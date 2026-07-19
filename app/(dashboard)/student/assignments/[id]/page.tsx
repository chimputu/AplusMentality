import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, ClipboardList } from 'lucide-react';
import AssignmentSubmitButton from '@/components/AssignmentSubmitButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentSubmitAssignmentPage({ params }: PageProps) {
  const { userId } = await requireAuth(['STUDENT']);
  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true } },
      submissions: {
        where: { userId },
        select: { id: true, score: true, status: true, submittedAt: true },
      },
    },
  });

  if (!assignment || !assignment.isPublished) {
    notFound();
  }

  const hasSubmitted = assignment.submissions.length > 0;

  if (hasSubmitted) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          You have already submitted this assignment
        </h2>
        <Link
          href={`/student/assignments/${id}/results`}
          className="inline-block mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View Results →
        </Link>
      </div>
    );
  }

  const isExpired = assignment.dueDate && new Date(assignment.dueDate) < new Date();
  // ✅ FIX: Coerce to boolean
  const isGoogleForm = !!(
    assignment.contentType === 'google_form' ||
    (!assignment.contentType && assignment.embedUrl)
  );
  const isPDF = assignment.contentType === 'pdf';
  const isImage = assignment.contentType === 'image';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/student/assignments"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Assignments
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{assignment.title}</h1>
        {assignment.description && (
          <p className="text-gray-600 dark:text-gray-300 mt-2">{assignment.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
          <span>Created by {assignment.creator?.name || 'Unknown'}</span>
          {assignment.maxScore && <span>Max Score: {assignment.maxScore}</span>}
          {assignment.dueDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> Due: {new Date(assignment.dueDate).toLocaleString()}
            </span>
          )}
          {isExpired && <span className="text-red-500 font-medium">Expired</span>}
        </div>
      </div>

      {isExpired ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 text-center">
          <p className="text-yellow-700 dark:text-yellow-400">This assignment is no longer open for submission.</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Assignment</h2>
            <div className="aspect-video w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              {isGoogleForm && <iframe src={assignment.embedUrl} className="w-full h-full" allowFullScreen />}
              {isPDF && assignment.fileUrl && <iframe src={assignment.fileUrl} className="w-full h-full" />}
              {isImage && assignment.fileUrl && <img src={assignment.fileUrl} alt={assignment.title} className="w-full h-full object-contain" />}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
              {isGoogleForm
                ? 'Complete the assignment above, then click the button below to submit.'
                : 'Review the content above, then click the button below to submit.'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <AssignmentSubmitButton
              assignmentId={assignment.id}
              formUrl={assignment.formUrl || ''}
              isGoogleForm={isGoogleForm}
            />
          </div>
        </>
      )}
    </div>
  );
}