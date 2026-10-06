'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ExternalLink, Clock, CheckCircle, XCircle, User } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  formUrl: string | null;
  dueDate: string | null;
  maxScore: number | null;
  creator: { name: string | null } | null;
  submissions: Array<{
    id: string;
    score: number | null;
    status: string;
    submittedAt: string;
  }>;
  createdAt: string;
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filtered, setFiltered] = useState<Assignment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/assignments')
      .then((res) => res.json())
      .then((data: Assignment[]) => {
        setAssignments(data);
        setFiltered(data);
      })
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = assignments;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (assignment) =>
          assignment.title.toLowerCase().includes(q) ||
          (assignment.description && assignment.description.toLowerCase().includes(q))
      );
    }
    if (statusFilter) {
      if (statusFilter === 'available') {
        result = result.filter((assignment) => assignment.submissions.length === 0);
      } else if (statusFilter === 'submitted') {
        result = result.filter((assignment) => assignment.submissions.length > 0);
      }
    }
    setFiltered(result);
  }, [search, statusFilter, assignments]);

  if (loading) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Assignments</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="submitted">Submitted</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          No assignments found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((assignment) => {
            const hasSubmitted = assignment.submissions.length > 0;
            const submission = assignment.submissions[0];

            return (
              <div
                key={assignment.id}
                className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition bg-white dark:bg-gray-800"
              >
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{assignment.title}</h3>
                {assignment.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {assignment.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                    Assignment
                  </span>
                  {assignment.maxScore && (
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                      Max Score: {assignment.maxScore}
                    </span>
                  )}
                  {assignment.dueDate && (
                    <span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  {assignment.creator?.name && (
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {assignment.creator.name}
                    </span>
                  )}
                </div>

                {/* Submission Status */}
                {hasSubmitted && (
                  <div className="mt-3 flex items-center gap-2">
                    {submission.status === 'GRADED' ? (
                      <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        Score: {submission.score || 0}%
                      </span>
                    ) : submission.status === 'RETURNED' ? (
                      <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4" />
                        Returned
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400">
                        <Clock className="w-4 h-4" />
                        Pending Review
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {hasSubmitted ? (
                    <Link
                      href={`/student/assignments/${assignment.id}/result`}
                      className="inline-flex items-center justify-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm flex-1 min-w-[120px]"
                    >
                      View Results
                    </Link>
                  ) : (
                    <Link
                      href={`/student/assignments/${assignment.id}`}
                      className="inline-flex items-center justify-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm flex-1 min-w-[120px]"
                    >
                      Submit Assignment
                    </Link>
                  )}
                  {assignment.formUrl && (
                    <a
                      href={assignment.formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm flex-1 min-w-[120px]"
                    >
                      <ExternalLink className="w-4 h-4" /> Open
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}