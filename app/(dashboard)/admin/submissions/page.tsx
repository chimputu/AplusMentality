// app/(dashboard)/admin/submissions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  FileQuestion,
  FileCheck,
  ClipboardList,
  X,
  Download,
} from 'lucide-react';
import { formatDateTime } from '@/lib/date-format';

interface Submission {
  id: string;
  type: 'QUIZ' | 'TEST' | 'ASSIGNMENT';
  formTitle: string;
  formId: string;
  userId: string;
  user: {
    name: string | null;
    email: string;
    clerkId: string;
    imageUrl: string | null;
  };
  score: number | null;
  total: number | null;
  feedback: string | null;
  status: 'PENDING' | 'GRADED' | 'RETURNED';
  submittedAt: string;
  gradedAt: string | null;
  fileUrl: string | null;
  responseId: string | null;
}

interface Stats {
  total: number;
  graded: number;
  pending: number;
  returned: number;
  byType: {
    quiz: number;
    test: number;
    assignment: number;
  };
}

function getGoogleDocsViewerUrl(fileUrl: string): string {
  const encoded = encodeURIComponent(fileUrl);
  return `https://docs.google.com/viewer?url=${encoded}&embedded=true`;
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'QUIZ':
      return <FileQuestion className="w-4 h-4 text-purple-500" />;
    case 'TEST':
      return <FileCheck className="w-4 h-4 text-orange-500" />;
    case 'ASSIGNMENT':
      return <ClipboardList className="w-4 h-4 text-blue-500" />;
    default:
      return <FileText className="w-4 h-4 text-gray-500" />;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'QUIZ':
      return 'Quiz';
    case 'TEST':
      return 'Test';
    case 'ASSIGNMENT':
      return 'Assignment';
    default:
      return type;
  }
}

function getSubmissionsHref(type: string, formId: string) {
  switch (type) {
    case 'QUIZ':
      return `/admin/quizzes/${formId}/submissions`;
    case 'TEST':
      return `/admin/tests/${formId}/submissions`;
    case 'ASSIGNMENT':
      return `/admin/assignments/${formId}/submissions`;
    default:
      return '#';
  }
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'QUIZ' | 'TEST' | 'ASSIGNMENT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'GRADED' | 'RETURNED'>('ALL');

  // Grading modal
  const [grading, setGrading] = useState<Submission | null>(null);
  const [scoreInput, setScoreInput] = useState('');
  const [totalInput, setTotalInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/submissions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load submissions');
      const data = await res.json();
      setSubmissions(data.submissions);
      setStats(data.stats);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter]);

  const openGradeModal = (sub: Submission) => {
    setGrading(sub);
    setScoreInput(sub.score !== null ? String(sub.score) : '');
    setTotalInput(String(sub.total ?? 100));
    setFeedbackInput(sub.feedback ?? '');
  };

  const closeModal = () => {
    setGrading(null);
    setScoreInput('');
    setFeedbackInput('');
  };

  const saveGrade = async () => {
    if (!grading || !scoreInput) return;
    setSaving(true);
    try {
      let apiUrl = '';
      switch (grading.type) {
        case 'QUIZ':
          apiUrl = `/api/quizzes/submissions/${grading.id}/grade`;
          break;
        case 'TEST':
          apiUrl = `/api/tests/submissions/${grading.id}/grade`;
          break;
        case 'ASSIGNMENT':
          apiUrl = `/api/assignments/submissions/${grading.id}/grade`;
          break;
      }

      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: scoreInput,
          total: totalInput,
          feedback: feedbackInput,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save grade');
      }

      closeModal();
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading submissions...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          All Submissions
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and grade all student submissions across quizzes, tests, and assignments.
        </p>

        {/* Stats */}
        {stats && (
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              📄 {stats.total} submission{stats.total !== 1 ? 's' : ''}
            </span>
            <span className="text-green-600 dark:text-green-400">
              ✅ {stats.graded} graded
            </span>
            <span className="text-yellow-600 dark:text-yellow-400">
              ⏳ {stats.pending} pending
            </span>
            {stats.returned > 0 && (
              <span className="text-blue-600 dark:text-blue-400">
                🔄 {stats.returned} returned
              </span>
            )}
            <span className="text-purple-600 dark:text-purple-400">
              📝 {stats.byType.quiz} quizzes
            </span>
            <span className="text-orange-600 dark:text-orange-400">
              📋 {stats.byType.test} tests
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              📎 {stats.byType.assignment} assignments
            </span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400 self-center mr-2">Type:</span>
          {(['ALL', 'QUIZ', 'TEST', 'ASSIGNMENT'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                typeFilter === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t !== 'ALL' && getTypeIcon(t)}
              {t === 'ALL' ? 'All Types' : t === 'QUIZ' ? 'Quizzes' : t === 'TEST' ? 'Tests' : 'Assignments'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400 self-center mr-2">Status:</span>
          {(['ALL', 'PENDING', 'GRADED', 'RETURNED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions list */}
      {submissions.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No submissions found.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Form</th>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">File</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Score</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {submissions.map((sub) => (
                  <tr key={`${sub.type}-${sub.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    {/* Type */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {getTypeIcon(sub.type)}
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {getTypeLabel(sub.type)}
                        </span>
                      </div>
                    </td>

                    {/* Form */}
                    <td className="px-4 py-3">
                      <Link
                        href={getSubmissionsHref(sub.type, sub.formId)}
                        className="text-blue-600 hover:underline font-medium text-gray-900 dark:text-gray-100"
                      >
                        {sub.formTitle}
                      </Link>
                    </td>

                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {sub.user.imageUrl ? (
                          <Image
                            src={sub.user.imageUrl}
                            alt=""
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                            {(sub.user.name || sub.user.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {sub.user.name || '—'}
                          </div>
                          <div className="text-xs text-gray-500">{sub.user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* File */}
                    <td className="px-4 py-3">
                      {sub.fileUrl ? (
                        <a
                          href={getGoogleDocsViewerUrl(sub.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Open
                        </a>
                      ) : sub.responseId ? (
                        <span className="text-xs text-gray-500">
                          Form: {sub.responseId.slice(0, 12)}…
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Submitted */}
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDateTime(sub.submittedAt)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          sub.status === 'GRADED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : sub.status === 'RETURNED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="px-4 py-3">
                      {sub.score !== null ? (
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {sub.score}/{sub.total ?? '—'}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openGradeModal(sub)}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        {sub.status === 'GRADED' ? 'Edit grade' : 'Grade'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {grading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              Grade Submission
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {grading.user.name || grading.user.email}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              {getTypeLabel(grading.type)}: {grading.formTitle}
            </p>

            {/* File preview link */}
            {grading.fileUrl && (
              <a
                href={getGoogleDocsViewerUrl(grading.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4"
              >
                <Download className="w-4 h-4" /> Open submitted file
              </a>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Score
                  </label>
                  <input
                    type="number"
                    value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="85"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Out of
                  </label>
                  <input
                    type="number"
                    value={totalInput}
                    onChange={(e) => setTotalInput(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="100"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Feedback
                </label>
                <textarea
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  placeholder="Comments for the student..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveGrade}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Grade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
