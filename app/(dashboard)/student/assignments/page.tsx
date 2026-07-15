import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ClipboardList, Calendar, User, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export default async function StudentAssignmentsPage() {
  const { userId } = await requireAuth(['STUDENT']);

  const assignmentsData = await prisma.assignment.findMany({
    where: { isPublished: true },
    include: {
      creator: {
        select: { name: true },
      },
      submissions: {
        where: { userId },
        select: {
          id: true,
          score: true,
          status: true,
          submittedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // ✅ Convert Dates to strings
  const assignments = assignmentsData.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    dueDate: a.dueDate ? a.dueDate.toISOString() : null,
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GRADED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'RETURNED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assignments</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Submit your assignments</p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <ClipboardList className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">No assignments available</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Check back later for new assignments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((assignment) => {
            const hasSubmitted = assignment.submissions.length > 0;
            const submission = assignment.submissions[0];

            return (
              <div
                key={assignment.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          Assignment
                        </span>
                        {assignment.maxScore && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Max Score: {assignment.maxScore}
                          </span>
                        )}
                        {assignment.dueDate && (
                          <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mt-2">
                        {assignment.title}
                      </h3>
                      {assignment.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submission Status */}
                  {hasSubmitted && (
                    <div className="mt-3 flex items-center gap-2">
                      {getStatusIcon(submission.status)}
                      <span className={`text-sm font-medium ${
                        submission.status === 'GRADED'
                          ? 'text-green-600 dark:text-green-400'
                          : submission.status === 'PENDING'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {submission.status === 'GRADED' 
                          ? `Score: ${submission.score || 0}%`
                          : submission.status === 'PENDING'
                          ? 'Pending Review'
                          : 'Returned'}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {assignment.creator?.name || 'Unknown'}
                    </div>
                    <div className="flex gap-2">
                      {hasSubmitted ? (
                        <Link
                          href={`/student/assignments/${assignment.id}/results`}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View Results
                        </Link>
                      ) : (
                        <Link
                          href={`/student/assignments/${assignment.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          Submit Assignment
                        </Link>
                      )}
                      <a
                        href={assignment.formUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
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