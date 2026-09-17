// app/(dashboard)/admin/past-papers/page.tsx
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, FileText, ExternalLink, Edit } from 'lucide-react';
import DeleteButton from '@/components/DeleteButton';

const CATEGORY_LABELS: Record<string, string> = {
  test: 'Test',
  quiz: 'Quiz',
  assignment: 'Assignment',
  final_exam: 'Final Exam',
};

const CATEGORY_COLORS: Record<string, string> = {
  test: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  quiz: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  assignment: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  final_exam: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

export default async function AdminPastPapersPage() {
  await requireAuth(['ADMIN']);

  const papers = await prisma.pastPaper.findMany({
    include: {
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Past Papers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Upload tests, quizzes, assignments, and final exams (PDF, image, DOCX)
          </p>
        </div>
        <Link
          href="/admin/past-papers/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Paper
        </Link>
      </div>

      {papers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No past papers yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Upload your first past paper.
          </p>
          <Link
            href="/admin/past-papers/create"
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Paper
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {papers.map((paper) => (
                  <tr
                    key={paper.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {paper.title}
                      </p>
                      {paper.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {paper.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          CATEGORY_COLORS[paper.category] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {CATEGORY_LABELS[paper.category] || paper.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {paper.courseCode || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {paper.year || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={paper.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" /> Open
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3 items-center">
                        <Link
                          href={`/admin/past-papers/${paper.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm inline-flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </Link>
                        <DeleteButton
                          apiUrl={`/api/past-papers/${paper.id}`}
                          itemName={paper.title}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}