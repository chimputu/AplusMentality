import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { BookOpen, Plus, Trash2, AlertCircle } from 'lucide-react';

export default async function TutorSpecialtiesPage() {
  const { userId } = await requireAuth(['TUTOR']);

  // Fetch tutor profile with specialties
  let tutorProfile: any = null;
  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    if (dbUser) {
      tutorProfile = await prisma.tutor.findFirst({
        where: { userId: dbUser.id },
        include: {
          specialties: {
            include: { course: true },
          },
        },
      });
    }
  } catch (err) {
    console.error('[TutorSpecialties] Failed to fetch tutor profile:', err);
  }

  if (!tutorProfile) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No tutor profile found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Your tutor profile is not yet set up.
          </p>
        </div>
      </div>
    );
  }

  const specialties = tutorProfile.specialties || [];

  // Fetch available courses that are not yet specialties
  let availableCourses: any[] = [];
  try {
    const specialtyCourseIds = specialties.map((s: any) => s.courseId);
    availableCourses = await prisma.course.findMany({
      where: {
        isPublished: true,
        NOT: {
          id: { in: specialtyCourseIds },
        },
      },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
      },
      orderBy: { title: 'asc' },
      take: 50,
    });
  } catch (err) {
    console.error('[TutorSpecialties] Failed to fetch available courses:', err);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Specialties</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Manage the courses you offer tutoring for
        </p>
      </div>

      {/* Current Specialties */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Your Specialties ({specialties.length})
        </h2>

        {specialties.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No specialties added yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Add courses below to start offering tutoring
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specialties.map((specialty: any) => (
              <div
                key={specialty.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {specialty.course?.code}: {specialty.course?.title}
                    </p>
                    {specialty.course?.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {specialty.course.description}
                      </p>
                    )}
                  </div>
                </div>
                <form action="/api/tutor/specialties" method="POST" className="flex-shrink-0">
                  <input type="hidden" name="specialtyId" value={specialty.id} />
                  <input type="hidden" name="action" value="remove" />
                  <button
                    type="submit"
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    title="Remove specialty"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Specialty */}
      {availableCourses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Add Specialty
          </h2>
          <form action="/api/tutor/specialties" method="POST" className="flex gap-3">
            <input type="hidden" name="action" value="add" />
            <select
              name="courseId"
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-sm text-gray-800 dark:text-gray-100"
              required
            >
              <option value="">Select a course...</option>
              {availableCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code}: {course.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
