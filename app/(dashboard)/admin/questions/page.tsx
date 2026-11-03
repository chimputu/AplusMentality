import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { Plus, Edit, Copy, Trash2 } from 'lucide-react';
import { listQuestions, deleteQuestion, duplicateQuestion } from '@/lib/actions/questions';
import { QuestionType } from '@/generated/prisma/client';

const typeColors: Record<string, string> = {
  MULTIPLE_CHOICE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  TRUE_FALSE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  FILL_IN_BLANK: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  SHORT_ANSWER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  NUMERIC: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  MATCHING: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  ESSAY: 'bg-gray-100 text-gray-800 dark:bg-input/30 dark:text-foreground',
  IMAGE_CHOICE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  FILE_UPLOAD: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; type?: string; page?: string }>;
}) {
  // Auth handled by layout (ADMIN + SUPER_ADMIN)
  const params = searchParams ? await searchParams : {};
  const search = params.search || undefined;
  const type = params.type as QuestionType | undefined;
  const page = params.page ? parseInt(params.page) : 1;

  let questions: any[] = [];
  let pagination: any = { page: 1, totalPages: 1, total: 0 };
  try {
    const result = await listQuestions({ search, type, page, pageSize: 20 });
    // SAFETY GUARD: Ensure questions is always a safe array, even if the query returns malformed data
    questions = Array.isArray(result?.questions) ? result.questions : [];
    pagination = result?.pagination ?? { page: 1, totalPages: 1, total: 0 };
  } catch (err) {
    console.error('[AdminQuestions] Failed to fetch questions:', err);
    questions = [];
  }
  // Ensure questions is always an array before rendering
  const safeQuestions = Array.isArray(questions) ? questions : [];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Question Bank</h1>
          <p className="text-gray-600 dark:text-muted-foreground text-sm">
            Create and manage reusable questions for assessments
          </p>
        </div>
        <Link
          href="/admin/questions/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          New Question
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Filter by type:</span>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/questions"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              !type ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-border text-gray-600 dark:text-muted-foreground hover:border-gray-400'
            }`}
          >
            All
          </Link>
          {['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'NUMERIC', 'MATCHING', 'ESSAY'].map((t) => (
            <Link
              key={t}
              href={`/admin/questions?type=${t}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                type === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 dark:border-border text-gray-600 dark:text-muted-foreground hover:border-gray-400'
              }`}
            >
              {t.replace(/_/g, ' ')}
            </Link>
          ))}
        </div>
      </div>

      {/* Search */}
      <form className="mb-4">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search questions..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg bg-card text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button type="submit" className="sr-only">Search</button>
      </form>

      {safeQuestions.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No questions yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first question to start building assessments.
          </p>
          <Link
            href="/admin/questions/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Create Question
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Prompt
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Points
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Used In
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {safeQuestions.map((q: any) => {
                  // SAFETY GUARDS: Protect against missing/undefined fields on individual question records
                  const safeType = q.type ?? 'ESSAY';
                  const safeAssessmentItems = Array.isArray(q.assessmentItems) ? q.assessmentItems : [];
                  const safeDifficulty = typeof q.difficulty === 'number' ? Math.min(5, Math.max(1, q.difficulty)) : 1;
                  return (
                  <tr key={q.id} className="hover:bg-muted">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          typeColors[safeType] || typeColors.ESSAY
                        }`}
                      >
                        {safeType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground truncate max-w-xs">
                        {q.prompt ?? ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-foreground">
                      {q.points ?? 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-foreground">
                      {'★'.repeat(safeDifficulty)}{'☆'.repeat(5 - safeDifficulty)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {safeAssessmentItems.length > 0
                        ? `${safeAssessmentItems.length} assessment${safeAssessmentItems.length > 1 ? 's' : ''}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/questions/${q.id}/edit`}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <form
                          action={async () => {
                            await duplicateQuestion(q.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </form>
                        <form
                          action={async () => {
                            if (confirm('Are you sure you want to delete this question?')) {
                              await deleteQuestion(q.id);
                            }
                          }}
                        >
                          <button
                            type="submit"
                            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                {pagination.page > 1 && (
                  <Link
                    href={`/admin/questions?page=${pagination.page - 1}`}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-muted transition"
                  >
                    Previous
                  </Link>
                )}
                {pagination.page < pagination.totalPages && (
                  <Link
                    href={`/admin/questions?page=${pagination.page + 1}`}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-muted transition"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
