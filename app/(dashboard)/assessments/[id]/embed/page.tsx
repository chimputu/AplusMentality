// Embed page for external assessments (Google Forms, MS Forms, etc.)
// Shows 404 for NATIVE assessments, full-height iframe for external
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default async function EmbedPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAuth();
  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      mode: true,
      embedUrl: true,
      formUrl: true,
      isPublished: true,
      liveStatus: true,
    },
  });

  if (!assessment) notFound();

  // Native assessments should not use the embed page
  if (assessment.mode === 'NATIVE') {
    notFound();
  }

  // Check if assessment is accessible
  if (!assessment.isPublished || assessment.liveStatus !== 'OPEN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Assessment Not Available
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            This assessment is not currently available.
          </p>
          <Link
            href="/student/assessments"
            className="text-blue-500 hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to assessments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/student/assessments"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {assessment.title}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              External assessment — you will be redirected to complete it
            </p>
          </div>
        </div>
        {assessment.formUrl && (
          <a
            href={assessment.formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
          >
            <ExternalLink className="w-4 h-4" />
            Open in new tab
          </a>
        )}
      </div>

      {/* Embed iframe */}
      {assessment.embedUrl ? (
        <iframe
          src={assessment.embedUrl}
          className="flex-1 w-full border-0"
          title={assessment.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : assessment.formUrl ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              External Assessment
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              This assessment is hosted externally. Click the button below to open it.
            </p>
            <a
              href={assessment.formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <ExternalLink className="w-5 h-5" />
              Start Assessment
            </a>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No embed URL configured for this assessment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
