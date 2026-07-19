import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Pencil } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/admin/lecture-slides"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Slides
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/admin/lecture-slides/${slide.id}/edit`}
            className="inline-flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Link>
          <a
            href={slide.embedUrl || slide.fileUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            <ExternalLink className="w-4 h-4" /> Open
          </a>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{slide.title}</h1>
        {slide.description && (
          <p className="text-gray-600 dark:text-gray-300 mt-2">{slide.description}</p>
        )}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
          {slide.category && <span>Category: {slide.category}</span>}
          {slide.course && <span>Course: {slide.course.code} – {slide.course.title}</span>}
          {slide.creator && <span>Uploaded by: {slide.creator.name}</span>}
          <span>Type: {slide.contentType || 'google_slides'}</span>
          <span>Order: {slide.order}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="aspect-video w-full bg-gray-100 dark:bg-gray-700">
          {slide.contentType === 'google_slides' && slide.embedUrl && (
            <iframe
              src={slide.embedUrl}
              className="w-full h-full"
              allowFullScreen
              title={slide.title}
            />
          )}
          {slide.contentType === 'pdf' && slide.fileUrl && (
            <iframe
              src={slide.fileUrl}
              className="w-full h-full"
              title={slide.title}
            />
          )}
          {!slide.embedUrl && !slide.fileUrl && (
            <div className="flex items-center justify-center h-full text-gray-500">
              No content available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}