// app/(dashboard)/admin/past-papers/[id]/edit/page.tsx
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EditPastPaperForm from './EditPastPaperForm';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPastPaperPage({ params }: PageProps) {
  await requireAuth(['ADMIN']);
  const { id } = await params;

  const paper = await prisma.pastPaper.findUnique({
    where: { id },
  });

  if (!paper) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/admin/past-papers"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Past Papers
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Edit Past Paper
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Editing <span className="font-semibold">{paper.title}</span>
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        <EditPastPaperForm
          initialData={{
            id: paper.id,
            title: paper.title,
            description: paper.description || '',
            courseCode: paper.courseCode || '',
            year: paper.year?.toString() || '',
            semester: paper.semester || '',
            category: paper.category,
            fileUrl: paper.fileUrl,
            fileType: paper.fileType || '',
            fileSize: paper.fileSize ?? null,
          }}
        />
      </div>
    </div>
  );
}