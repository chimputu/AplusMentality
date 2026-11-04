export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CreateCourseForm from '@/components/CreateCourseForm';

export default async function CreateCoursePage() {
  // Auth handled by layout (ADMIN + SUPER_ADMIN)
  let universities: any[] = [];
  try {
    // Load universities server-side to avoid client-side auth issues
    universities = await prisma.university.findMany({
      orderBy: { name: 'asc' },
      include: {
        programmes: {
          orderBy: { name: 'asc' },
        },
      },
    });
  } catch (err) {
    console.error('[CreateCourse] Failed to fetch universities:', err);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create Course</h1>
        <p className="text-gray-600 dark:text-muted-foreground text-sm">
          Add a new course to your learning platform
        </p>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border p-6">
        <CreateCourseForm universities={universities} />
      </div>
    </div>
  );
}