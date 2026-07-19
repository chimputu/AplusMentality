import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LectureSlideForm from '@/components/LectureSlideForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLectureSlidePage({ params }: PageProps) {
  await requireAuth(['ADMIN']);
  const { id } = await params;
  const slide = await prisma.lectureSlide.findUnique({ where: { id } });
  if (!slide) notFound();

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/lecture-slides" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold mb-6">Edit Lecture Slide</h1>
      <LectureSlideForm initialData={slide} isEditing />
    </div>
  );
}