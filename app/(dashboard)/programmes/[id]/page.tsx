import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { BookOpen } from 'lucide-react';

export default async function StudentProgrammePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const programme = await prisma.programme.findUnique({
    where: { id },
    include: {
      institution: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!programme) notFound();

  const institutionId = programme.institutionId;

  const levels = await prisma.academicLevel.findMany({
    where: { institutionId: institutionId || undefined },
    orderBy: { order: 'asc' },
  });

  const courses = await prisma.course.findMany({
    where: { programmeId: id, isPublished: true },
    include: {
      academicPeriod: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const tree = {
    programme: { id: programme.id, name: programme.name, code: programme.code },
    institution: programme.institution,
    levels: levels.map((level) => ({
      id: level.id,
      name: level.name,
      order: level.order,
      courses: courses
        .filter((c) => c.levelId === level.id)
        .map((c) => ({
          id: c.id,
          code: c.code,
          name: c.title,
          description: c.description,
          yearNumber: c.yearNumber,
          period: c.academicPeriod,
        })),
    })),
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tree.programme.name}
          </h1>
          {tree.programme.code && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
              {tree.programme.code}
            </span>
          )}
        </div>
        {tree.institution && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {tree.institution.name}
          </p>
        )}
      </div>

      {tree.levels.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No courses available
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Courses for this programme will be added soon.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tree.levels.map((level) => (
            <div
              key={level.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {level.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {level.courses.length} course{level.courses.length !== 1 ? 's' : ''}
                </p>
              </div>

              {level.courses.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                  No courses yet for this year
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Code
                        </th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Name
                        </th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Period
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {level.courses.map((course: any) => (
                        <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-2 text-sm font-mono text-gray-700 dark:text-gray-300">
                            {course.code}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {course.name}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {course.period?.name || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
