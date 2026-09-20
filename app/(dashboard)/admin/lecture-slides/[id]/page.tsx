// app/(dashboard)/admin/lecture-slides/[id]/page.tsx
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Pencil, Download } from 'lucide-react';
import { getInlineUrl } from '@/lib/cloudinary-url';
import SlideViewerButton from '@/components/SlideViewerButton';

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

export default async function AdminLectureSlidePage({ params }: PageProps) {
  await requireAuth(['ADMIN']);
  const { id } = await params;

  const slide = await prisma.lectureSlide.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true, email: true } },
      course: { select: { id: true, title: true, code: true } },
    },
  });

  if (!slide) {
    notFound();
  }

  const inlineUrl = getInlineUrl(slide.fileUrl);
  const downloadUrl = slide.fileUrl || '';

  // ⭐ Detect PDF vs. Google Slides
  const isPdf =
    slide.contentType === 'pdf' ||
    (slide.fileUrl?.toLowerCase().endsWith('.pdf') ?? false);
  const isGoogleSlides = slide.contentType === 'google_slides' && !!slide.embedUrl;

  // ⭐ "Open in new tab" URL:
  // - Google Slides → the embed URL
  // - PDF → Google Docs Viewer (opens inline in new tab)
  // - Other → raw file URL
  const openUrl = isGoogleSlides
    ? slide.embedUrl
    : isPdf && slide.fileUrl
      ? getGoogleDocsViewerUrl(slide.fileUrl)
      : slide.fileUrl || '#';

  // ⭐ Inline preview URL for the iframe:
  // - Google Slides → embed URL
  // - PDF → Google Docs Viewer
  // - Other file → raw URL
  const previewUrl = isGoogleSlides
    ? slide.embedUrl!
    : isPdf && slide.fileUrl
      ? getGoogleDocsViewerUrl(slide.fileUrl)
      : slide.fileUrl || '';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/admin/lecture-slides"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Slides
        </Link>

        {/* ✅ Mobile-friendly action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <Link
            href={`/admin/lecture-slides/${slide.id}/edit`}
            className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition w-full sm:w-auto"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Link>

          {/* View in App — only if there's a file (PDF/image) */}
          {slide.fileUrl && (
            <SlideViewerButton
              fileUrl={slide.fileUrl}
              title={slide.title}
              fileType={slide.contentType}
            />
          )}

          {/* Open in new tab — uses Google Docs Viewer for PDFs */}
          {openUrl && openUrl !== '#' && (
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4" /> Open
            </a>
          )}

          {/* Download */}
          {slide.fileUrl && (
            <a
              href={downloadUrl}
              download
              className="inline-flex items-center justify-center gap-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition w-full sm:w-auto"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          )}
        </div>
      </div>

      {/* Slide metadata */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {slide.title}
        </h1>
        {slide.description && (
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {slide.description}
          </p>
        )}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
          {slide.category && <span>Category: {slide.category}</span>}
          {slide.course && (
            <span>
              Course: {slide.course.code} – {slide.course.title}
            </span>
          )}
          {slide.creator && <span>Uploaded by: {slide.creator.name}</span>}
          <span>Type: {slide.contentType || 'google_slides'}</span>
          <span>Order: {slide.order}</span>
        </div>
      </div>

      {/* Content preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="aspect-video w-full bg-gray-100 dark:bg-gray-700">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full"
              allowFullScreen
              title={slide.title}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              No content available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}