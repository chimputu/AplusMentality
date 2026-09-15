// app/(dashboard)/student/lecture-slides/[id]/page.tsx
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Presentation, Download, ExternalLink } from 'lucide-react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudentLectureSlideDetailPage({ params }: PageProps) {
  await requireAuth(['STUDENT', 'ADMIN']);
  const { id } = await params;

  const slide = await prisma.lectureSlide.findUnique({
    where: { id },
    include: {
      course: true,
      creator: true,
    },
  });

  if (!slide) {
    notFound();
  }

  const embedUrl = slide.embedUrl;
  const isPdf =
    slide.contentType === 'pdf' ||
    (slide.fileUrl?.toLowerCase().endsWith('.pdf') ?? false);

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
          <p className="text-gray-600 dark:text-gray-300 mt-2">{slide.description}</p>
        )}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {/* Embedded slides (Google Slides, etc.) */}
        {embedUrl && (
          <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <iframe
              src={embedUrl}
              title={slide.title}
              className="absolute top-0 left-0 w-full h-full"
              allowFullScreen
            />
          </div>
        )}

        {/* Direct file (PDF, etc.) */}
        {slide.fileUrl && (
          <div className="flex flex-col gap-3">
            {isPdf ? (
              <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <iframe
                  src={slide.fileUrl}
                  title={slide.title}
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  This slide is available as a file.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <a
                href={slide.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition"
              >
                <ExternalLink className="w-4 h-4" />
                Open in new tab
              </a>
              <a
                href={slide.fileUrl}
                download
                className="inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-medium px-5 py-2.5 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!embedUrl && !slide.fileUrl && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              No content yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              This lecture slide doesn&apos;t have any file or embed attached yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}