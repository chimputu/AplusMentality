// app/(dashboard)/student/lecture-slides/[id]/page.tsx
import { requireAuth } from '@/lib/auth';
import { getScopeContext, isResourceInScope } from '@/lib/auth/scope';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Presentation, Download, ExternalLink } from 'lucide-react';
import SlideViewerButton from '@/components/SlideViewerButton';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Wraps a PDF URL with Google Docs Viewer for reliable inline display.
 * Works across all browsers — Windows, Mac, Android, iOS.
 */
function getGoogleDocsViewerUrl(fileUrl: string): string {
  const encoded = encodeURIComponent(fileUrl);
  return `https://docs.google.com/viewer?url=${encoded}&embedded=true`;
}

export default async function StudentLectureSlideDetailPage({
  params,
}: PageProps) {
  const authResult = await requireAuth(['STUDENT', 'ADMIN']);
  const { id } = await params;

  // SECURITY: Resolve user's academic scope to prevent IDOR
  const scope = await getScopeContext();

  let slide: any = null;
  try {
    slide = await prisma.lectureSlide.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, code: true, universityId: true } },
        creator: true,
      },
    });
  } catch (err) {
    console.error('[StudentLectureSlideDetail] Failed to fetch slide:', err);
  }

  if (!slide) {
    notFound();
  }

  // SECURITY: Block access if the slide's course is not in the user's scope
  // Admins can access any slide; students can only access slides from their university
  if (!isResourceInScope(scope, slide.course?.universityId ?? null)) {
    notFound();
  }

  const embedUrl = slide.embedUrl;
  const downloadUrl = slide.fileUrl || '';

  const isPdf =
    slide.contentType === 'pdf' ||
    (slide.fileUrl?.toLowerCase().endsWith('.pdf') ?? false);
  const isGoogleSlides = slide.contentType === 'google_slides' && !!slide.embedUrl;

  // ⭐ Preview URL — Google Slides embed OR Google Docs Viewer for PDFs
  const previewUrl = isGoogleSlides
    ? slide.embedUrl!
    : isPdf && slide.fileUrl
      ? getGoogleDocsViewerUrl(slide.fileUrl)
      : slide.fileUrl || '';

  // ⭐ "Open in new tab" URL
  const openUrl = isGoogleSlides
    ? slide.embedUrl!
    : isPdf && slide.fileUrl
      ? getGoogleDocsViewerUrl(slide.fileUrl)
      : slide.fileUrl || '';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/student/lecture-slides"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Lecture Slides
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2 flex-wrap">
          <Presentation className="w-4 h-4" />
          <span>Lecture Slide</span>
          {slide.category && (
            <>
              <span>•</span>
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                {slide.category}
              </span>
            </>
          )}
          {slide.course && (
            <>
              <span>•</span>
              <span>{slide.course.title}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {slide.title}
        </h1>
        {slide.description && (
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {slide.description}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {/* Preview — Google Slides embed OR Google Docs Viewer */}
        {previewUrl ? (
          <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <iframe
              src={previewUrl}
              title={slide.title}
              className="absolute top-0 left-0 w-full h-full"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              No content yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              This lecture slide doesn&apos;t have any file or embed attached
              yet.
            </p>
          </div>
        )}

        {/* Action buttons */}
        {slide.fileUrl && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <SlideViewerButton
              fileUrl={slide.fileUrl}
              title={slide.title}
              fileType={slide.contentType}
            />
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-medium px-5 py-3 sm:py-2.5 rounded-lg transition w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4" />
              Open in new tab
            </a>
            <a
              href={downloadUrl}
              download
              className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-medium px-5 py-3 sm:py-2.5 rounded-lg transition w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}