// app/(dashboard)/student/past-papers/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  Calendar,
  Download,
  ExternalLink,
  Image as ImageIcon,
  File as FileIcon,
} from 'lucide-react';

interface PastPaper {
  id: string;
  title: string;
  description: string | null;
  courseCode: string | null;
  year: number | null;
  semester: string | null;
  category: string;
  fileUrl: string;
  fileType: string | null;
  createdAt: string;
}

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

function getFileIcon(type: string | null) {
  if (type === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
  if (type === 'image') return <ImageIcon className="w-5 h-5 text-blue-500" />;
  if (type === 'docx') return <FileIcon className="w-5 h-5 text-indigo-500" />;
  return <FileText className="w-5 h-5 text-gray-500" />;
}

export default function StudentPastPapersPage() {
  const [papers, setPapers] = useState<PastPaper[]>([]);
  const [filtered, setFiltered] = useState<PastPaper[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/past-papers')
      .then((r) => r.json())
      .then((data) => {
        setPapers(Array.isArray(data) ? data : []);
        setFiltered(Array.isArray(data) ? data : []);
      })
      .catch(() => setPapers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = papers;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.courseCode?.toLowerCase() || '').includes(q) ||
          (p.description?.toLowerCase() || '').includes(q)
      );
    }

    if (categoryFilter) {
      result = result.filter((p) => p.category === categoryFilter);
    }

    if (yearFilter) {
      result = result.filter((p) => String(p.year) === yearFilter);
    }

    setFiltered(result);
  }, [search, categoryFilter, yearFilter, papers]);

  const years = [...new Set(papers.map((p) => p.year).filter(Boolean))].sort(
    (a, b) => (b as number) - (a as number)
  );

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Past Papers
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Browse and download tests, quizzes, assignments, and final exam papers
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by title or course code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">All Categories</option>
          <option value="test">Tests</option>
          <option value="quiz">Quizzes</option>
          <option value="assignment">Assignments</option>
          <option value="final_exam">Final Exams</option>
        </select>

        {/* Year */}
        {years.length > 0 && (
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filtered.length} paper{filtered.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {search || categoryFilter || yearFilter
              ? 'No past papers match your filters.'
              : 'No past papers available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((paper) => (
            <div
              key={paper.id}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  {getFileIcon(paper.fileType)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {paper.title}
                  </h3>
                  {paper.courseCode && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                      {paper.courseCode}
                    </p>
                  )}
                </div>
              </div>

              {/* Category badge */}
              <div className="mb-3">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                    CATEGORY_COLORS[paper.category] ||
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {CATEGORY_LABELS[paper.category] || paper.category}
                </span>
              </div>

              {/* Description */}
              {paper.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {paper.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4 mt-auto">
                {paper.year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {paper.year}
                  </span>
                )}
                {paper.semester && <span>• {paper.semester}</span>}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={paper.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open
                </a>
                <a
                  href={paper.fileUrl}
                  download
                  className="inline-flex items-center justify-center gap-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm font-medium transition"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}