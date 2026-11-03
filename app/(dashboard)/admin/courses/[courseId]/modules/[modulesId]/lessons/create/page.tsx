import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CreateLessonForm from '@/components/CreateLessonForm';

interface PageProps {
  params: Promise<{
    courseId: string;
    modulesId: string;   // ✅ match your folder name
  }>;
}

export default async function CreateLessonPage({ params }: PageProps) {
  // Auth handled by layout (ADMIN + SUPER_ADMIN)
  const { courseId, modulesId } = await params;

  const [course, module] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    }),
    prisma.module.findUnique({
      where: { id: modulesId },
      select: { id: true, title: true, courseId: true },
    }),
  ]);

  if (!course || !module || module.courseId !== courseId) {
    notFound();
  }
  const c = course!;
  const m = module!;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/admin/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {c.title}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create Lesson</h1>
        <p className="text-gray-600 dark:text-muted-foreground text-sm">
          Add a new lesson to <span className="font-semibold">{m.title}</span>
        </p>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border p-6">
        <CreateLessonForm moduleId={modulesId} />
      </div>
    </div>
  );
}