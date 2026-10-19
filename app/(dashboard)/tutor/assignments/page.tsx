import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ClipboardList, Calendar, Users, FileText } from 'lucide-react';

export default async function TutorAssignmentsPage() {
  await requireAuth(['TUTOR']);

  let assignmentsData: any[] = [];
  try {
    assignmentsData = await prisma.assignment.findMany({
      where: { isPublished: true },
      include: {
        course: {
          select: { code: true, title: true },
        },
        creator: {
          select: { name: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 50,
    });
  } catch (err) {
    console.error('[TutorAssignments] Failed to fetch assignments:', err);
  }

  const assignments = (Array.isArray(assignmentsData) ? assignmentsData : []).map((a: any) => ({
    ...a,
    createdAt: a.createdAt?.toISOString() ?? new Date().toISOString(),
    dueDate: a.dueDate?.toISOString() ?? new Date().toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assignments</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          View published assignments you can help students with
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <ClipboardList className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No assignments available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Assignments will appear here when they are published
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment: any) => (
            <div
              key={assignment.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                      {assignment.course?.code}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {assignment.course?.title}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {assignment.title}
                  </h3>
                  {assignment.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                      {assignment.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {assignment._count?.submissions || 0} submissions
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {assignment.creator?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  new Date(assignment.dueDate) > new Date()
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                  {new Date(assignment.dueDate) > new Date() ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
