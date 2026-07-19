import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentLectureSlidePage({ params }: PageProps) {
  await requireAuth(['STUDENT']);
  const { id } = await params;
  const slide = await prisma.lectureSlide.findUnique({
    where: { id },
    include: {
      course: { select: { title: true, code: true } },
      creator: { select: { name: true } },
    },
  });
  if (!slide) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/student/lecture-slides" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Slides
      </Link>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h1 className="text-2xl font-bold">{slide.title}</h1>
        {slide.description && <p className="text-gray-600 dark:text-gray-300 mt-2">{slide.description}</p>}
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
          {slide.category && <span>Category: {slide.category}</span>}
          {slide.course && <span>Course: {slide.course.title}</span>}
          {slide.creator && <span>Uploaded by: {slide.creator.name}</span>}
        </div>
      </div>
      <div className="aspect-video w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
        {slide.contentType === 'google_slides' && slide.embedUrl && (
          <iframe src={slide.embedUrl} className="w-full h-full" allowFullScreen />
        )}
        {slide.contentType === 'pdf' && slide.fileUrl && (
          <iframe src={slide.fileUrl} className="w-full h-full" />
        )}
        {!slide.embedUrl && !slide.fileUrl && (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            No content available
          </div>
        )}
      </div>
    </div>
  );
}