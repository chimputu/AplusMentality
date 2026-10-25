import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileText, Calendar, Users, BookOpen, Plus } from 'lucide-react';

export default async function LecturerPastPapersPage() {
  const { userId } = await requireAuth(['LECTURER']);

  let papersData: any[] = [];
  try {
    papersData = await prisma.pastPaper.findMany({
      where: { createdBy: userId },
      include: {
        course: {
          select: { code: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('[LecturerPastPapers] Failed to fetch papers:', err);
  }

  const papers = (Array.isArray(papersData) ? papersData : []).map((p: any) => ({
    ...p,
    createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Past Papers</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Past exam papers you have uploaded
          </p>
        </div>
        <Link
          href="/admin/past-papers/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Upload Paper
        </Link>
      </div>

      {papers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No past papers yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Upload your first past paper to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {papers.map((paper: any) => (
            <div
              key={paper.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {paper.course && (
                      <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                        {paper.course.code}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                    {paper.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(paper.createdAt).toLocaleDateString()}
                    </span>
                    {paper.semester && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {paper.semester}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
