// app/(dashboard)/admin/quizzes/[id]/submissions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink, FileText, X } from 'lucide-react';

interface Submission {
  id: string;
  userId: string;
  fileUrl: string | null;
  responseId: string | null;
  score: number | null;
  total: number | null;
  feedback: string | null;
  status: 'PENDING' | 'GRADED' | 'RETURNED';
  submittedAt: string;
  gradedAt: string | null;
  user: {
    name: string | null;
    email: string;
    clerkId: string;
    imageUrl: string | null;
  };
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  formUrl: string | null;
  embedUrl: string | null;
  submissions: Submission[];
}

export default function AdminQuizSubmissionsPage() {
  const params = useParams();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'GRADED'>('ALL');
  const [grading, setGrading] = useState<Submission | null>(null);
  const [scoreInput, setScoreInput] = useState('');
  const [totalInput, setTotalInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/submissions`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setQuiz(data);
      setTotalInput(String(data.maxScore ?? 100));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const openGrade = (sub: Submission) => {
    setGrading(sub);
    setScoreInput(sub.score !== null ? String(sub.score) : '');
    setTotalInput(String(sub.total ?? 100));
    setFeedbackInput(sub.feedback ?? '');
  };

  const saveGrade = async () => {
    if (!grading || !scoreInput) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/quizzes/submissions/${grading.id}/grade`, {
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
        throw new Error(err.error || 'Failed');
      }
      setGrading(null);
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!quiz) return <div className="text-center py-8">Quiz not found.</div>;

  const filtered = quiz.submissions.filter((s) => filter === 'ALL' || s.status === filter);
  const stats = {
    total: quiz.submissions.length,
    graded: quiz.submissions.filter((s) => s.status === 'GRADED').length,
    pending: quiz.submissions.filter((s) => s.status === 'PENDING').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/admin/quizzes"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Quizzes
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {quiz.title}
        </h1>
        {quiz.description && (
          <p className="text-gray-600 dark:text-gray-400 mt-1">{quiz.description}</p>
        )}
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
        </div>

        {/* Link to the Google Form */}
        {quiz.formUrl && (
          <a
            href={quiz.formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm text-blue-600 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Open linked Google Form
          </a>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['ALL', 'PENDING', 'GRADED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {f === 'ALL' ? 'All' : f === 'PENDING' ? 'Pending' : 'Graded'}
          </button>
        ))}
      </div>

      {/* Submissions list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'ALL'
              ? 'No submissions yet.'
              : `No ${filter.toLowerCase()} submissions.`}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">File / Response</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Score</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {sub.user.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sub.user.imageUrl}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                            {(sub.user.name || sub.user.email)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {sub.user.name || '—'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {sub.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {sub.fileUrl ? (
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Open file
                        </a>
                      ) : sub.responseId ? (
                        <span className="text-xs text-gray-500">
                          Form response: {sub.responseId.slice(0, 10)}…
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(sub.submittedAt).toLocaleString('en-GB')}
                    </td>
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
                    <td className="px-4 py-3">
                      {sub.score !== null ? (
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {sub.score}/{sub.total ?? '—'}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openGrade(sub)}
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
              onClick={() => setGrading(null)}
              className="absolute top-3 right-3 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              Grade Quiz Submission
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {grading.user.name || grading.user.email}
            </p>

            {/* File link if available */}
            {grading.fileUrl && (
              <a
                href={grading.fileUrl}
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
                onClick={() => setGrading(null)}
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