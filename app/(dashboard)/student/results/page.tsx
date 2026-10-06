import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  FileQuestion,
  FileCheck,
  ClipboardList,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  MessageCircle,
} from 'lucide-react';

type SubmissionType = 'quiz' | 'test' | 'assignment';

interface Submission {
  id: string;
  type: SubmissionType;
  title: string;
  description?: string | null;
  score: number | null;
  total: number | null;
  feedback?: string | null;
  status: 'PENDING' | 'GRADED' | 'RETURNED';
  submittedAt: string;
  gradedAt: string | null;
  dueDate?: string | null;
  creatorName?: string | null;
  maxScore?: number | null;
}

export default async function StudentResultsPage() {
  const { userId } = await requireAuth(['STUDENT']);

  // Fetch all submissions in parallel
  const [quizSubmissions, testSubmissions, assignmentSubmissions] = await Promise.all([
    prisma.quizSubmission.findMany({
      where: { userId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            creator: { select: { name: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.testSubmission.findMany({
      where: { userId },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            maxScore: true,
            creator: { select: { name: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.assignmentSubmission.findMany({
      where: { userId },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            maxScore: true,
            creator: { select: { name: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    }),
  ]);

  // Normalize all submissions into a unified format
  const allSubmissions: Submission[] = [
    ...quizSubmissions.map((s) => ({
      id: s.quiz.id,
      type: 'quiz' as SubmissionType,
      title: s.quiz.title,
      description: s.quiz.description,
      score: s.score,
      total: s.total,
      feedback: s.feedback,
      status: s.status,
      submittedAt: s.submittedAt.toISOString(),
      gradedAt: s.gradedAt?.toISOString() || null,
      dueDate: s.quiz.dueDate?.toISOString() || null,
      creatorName: s.quiz.creator?.name || null,
    })),
    ...testSubmissions.map((s) => ({
      id: s.test.id,
      type: 'test' as SubmissionType,
      title: s.test.title,
      description: s.test.description,
      score: s.score,
      total: s.total,
      feedback: s.feedback,
      status: s.status,
      submittedAt: s.submittedAt.toISOString(),
      gradedAt: s.gradedAt?.toISOString() || null,
      dueDate: s.test.dueDate?.toISOString() || null,
      creatorName: s.test.creator?.name || null,
      maxScore: s.test.maxScore,
    })),
    ...assignmentSubmissions.map((s) => ({
      id: s.assignment.id,
      type: 'assignment' as SubmissionType,
      title: s.assignment.title,
      description: s.assignment.description,
      score: s.score,
      total: s.total,
      feedback: s.feedback,
      status: s.status,
      submittedAt: s.submittedAt.toISOString(),
      gradedAt: s.gradedAt?.toISOString() || null,
      dueDate: s.assignment.dueDate?.toISOString() || null,
      creatorName: s.assignment.creator?.name || null,
      maxScore: s.assignment.maxScore,
    })),
  ];

  // Sort by most recent submission first
  allSubmissions.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  // Calculate summary stats
  const gradedSubmissions = allSubmissions.filter(
    (s) => s.status === 'GRADED' || s.status === 'RETURNED'
  );
  const pendingSubmissions = allSubmissions.filter((s) => s.status === 'PENDING');

  const totalScore = gradedSubmissions.reduce(
    (sum, s) => sum + (s.score || 0),
    0
  );
  const totalPossible = gradedSubmissions.reduce(
    (sum, s) => sum + (s.total || 0),
    0
  );
  const averagePercentage =
    totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

  // Type-specific config
  const typeConfig = {
    quiz: {
      label: 'Quiz',
      icon: FileQuestion,
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
      iconColor: 'text-blue-600 dark:text-blue-400',
      resultPath: '/student/quizzes',
    },
    test: {
      label: 'Test',
      icon: FileCheck,
      color: 'indigo',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      textColor: 'text-indigo-700 dark:text-indigo-400',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      resultPath: '/student/tests',
    },
    assignment: {
      label: 'Assignment',
      icon: ClipboardList,
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
      iconColor: 'text-green-600 dark:text-green-400',
      resultPath: '/student/assignments',
    },
  };

  const statusConfig = {
    GRADED: {
      label: 'Graded',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
      icon: CheckCircle,
    },
    RETURNED: {
      label: 'Returned',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-700 dark:text-purple-400',
      icon: CheckCircle,
    },
    PENDING: {
      label: 'Pending Review',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      icon: Clock,
    },
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          My Results
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View all your quiz, test, and assignment results in one place.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <FileQuestion className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Quizzes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {quizSubmissions.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tests</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {testSubmissions.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Assignments</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {assignmentSubmissions.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {gradedSubmissions.length > 0 ? `${averagePercentage}%` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      {allSubmissions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            No results yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Once you submit quizzes, tests, or assignments, your results will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allSubmissions.map((submission) => {
            const config = typeConfig[submission.type];
            const status = statusConfig[submission.status];
            const StatusIcon = status.icon;
            const TypeIcon = config.icon;
            const isGraded =
              submission.status === 'GRADED' || submission.status === 'RETURNED';
            const percentage =
              isGraded && submission.score && submission.total
                ? Math.round((submission.score / submission.total) * 100)
                : null;

            return (
              <div
                key={`${submission.type}-${submission.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Type Icon & Title */}
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-12 h-12 ${config.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <TypeIcon className={`w-6 h-6 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}
                        >
                          {config.label}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {submission.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Submitted{' '}
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                        {submission.dueDate && (
                          <span className="flex items-center gap-1">
                            Due: {new Date(submission.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score Display */}
                  <div className="flex items-center gap-6">
                    {isGraded ? (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {submission.score}
                          <span className="text-sm text-gray-400 font-normal">
                            /{submission.total}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {percentage}%
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-300 dark:text-gray-600">
                          —
                        </div>
                        <div className="text-sm text-gray-400">Awaiting grade</div>
                      </div>
                    )}

                    {/* Actions */}
                    <Link
                      href={`${config.resultPath}/${submission.id}/result`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex-shrink-0"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Feedback Preview */}
                {submission.feedback && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-2">
                      <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Feedback
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
                          {submission.feedback}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
