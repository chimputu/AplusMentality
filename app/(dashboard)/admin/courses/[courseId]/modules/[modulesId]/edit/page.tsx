import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CreateModuleForm from '@/components/CreateModuleForm';

interface PageProps {
  params: Promise<{
    courseId: string;  // ✅ Changed from 'id' to 'courseId'
  }>;
}

export default async function CreateModulePage({ params }: PageProps) {
  await requireAuth(['ADMIN']);
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, code: true },
  });

  if (!course) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/admin/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {course.title}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Module</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Add a new module to <span className="font-semibold">{course.title}</span> ({course.code})
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <CreateModuleForm courseId={courseId} />
      </div>
    </div>
  );
}