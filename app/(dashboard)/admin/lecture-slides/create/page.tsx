import { requireAuth } from '@/lib/auth';
import LectureSlideForm from '@/components/LectureSlideForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function CreateLectureSlidePage() {
  await requireAuth(['ADMIN']);
  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/lecture-slides" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold mb-6">Create Lecture Slide</h1>
      <LectureSlideForm />
    </div>
  );
}