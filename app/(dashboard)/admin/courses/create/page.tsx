import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CreateCourseForm from '@/components/CreateCourseForm';

export default async function CreateCoursePage() {
  await requireAuth(['ADMIN']);

  // Load universities server-side to avoid client-side auth issues
  const universities = await prisma.university.findMany({
    orderBy: { name: 'asc' },
    include: {
      programmes: {
        orderBy: { name: 'asc' },
      },
    },
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Course</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Add a new course to your learning platform
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <CreateCourseForm universities={universities} />
      </div>
    </div>
  );
}