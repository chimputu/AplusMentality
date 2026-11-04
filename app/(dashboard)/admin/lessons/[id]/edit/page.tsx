export const dynamic = 'force-dynamic';

// app/(dashboard)/admin/lessons/[id]/edit/page.tsx
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CreateLessonForm from '@/components/CreateLessonForm';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminLessonEditPage({ params }: PageProps) {
  // Auth handled by layout (ADMIN + SUPER_ADMIN)
  const { id } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      video: true,
      slides: true,
      quiz: true,
      module: {
        include: {
          course: {
            select: { id: true, title: true, code: true },
          },
        },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  const course = lesson.module.course;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/admin/courses/${course.id}`}
        className="inline-flex items-center gap-2 text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {course.title}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Edit Lesson
        </h1>
        <p className="text-gray-600 dark:text-muted-foreground text-sm">
          Editing <span className="font-semibold">{lesson.title}</span> in{' '}
          {lesson.module.title}
        </p>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border p-6">
        <CreateLessonForm
          moduleId={lesson.moduleId}
          lessonId={lesson.id}
          isEditing={true}
          initialData={{
            title: lesson.title,
            description: lesson.description,
            order: lesson.order,
            videoId: lesson.videoId,
            slidesId: lesson.slidesId,
            quizId: lesson.quizId,
          }}
        />
      </div>
    </div>
  );
}