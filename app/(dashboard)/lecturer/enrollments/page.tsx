import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Users, Calendar, BookOpen, ArrowLeft } from 'lucide-react';

export default async function LecturerEnrollmentsPage() {
  const { userId } = await requireAuth(['LECTURER']);

  let enrollmentsData: any[] = [];
  try {
    enrollmentsData = await prisma.enrollment.findMany({
      where: { course: { createdBy: userId } },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true, code: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  } catch (err) {
    console.error('[LecturerEnrollments] Failed to fetch enrollments:', err);
  }

  const enrollments = (Array.isArray(enrollmentsData) ? enrollmentsData : []).map((e: any) => ({
    ...e,
    enrolledAt: e.enrolledAt?.toISOString() ?? new Date().toISOString(),
    user: e.user,
    course: e.course,
  }));

  // Group by course
  const groupedByCourse: Record<string, any[]> = {};
  for (const enrollment of enrollments) {
    const key = enrollment.course?.id || 'unknown';
    if (!groupedByCourse[key]) groupedByCourse[key] = [];
    groupedByCourse[key].push(enrollment);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/lecturer"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Course Enrollments</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Students enrolled in your courses
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No enrollments yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Students enrolled in your courses will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByCourse).map(([courseId, courseEnrollments]) => {
            const course = courseEnrollments[0]?.course;
            return (
              <div key={courseId}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                    {course?.code}
                  </span>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {course?.title}
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({courseEnrollments.length} students)
                  </span>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50">
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Enrolled
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {courseEnrollments.map((enrollment: any) => (
                          <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                  <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {enrollment.user?.name || 'Unknown'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {enrollment.user?.email || '-'}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center justify-end gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(enrollment.enrolledAt).toLocaleDateString()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
