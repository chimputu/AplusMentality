'use client';

// Assessment builder/edit page — view and manage an existing assessment
import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { formatDate, formatDateTime } from '@/lib/date-format';
import {
  getAssessment,
  updateAssessment,
  publishAssessment,
  unpublishAssessment,
  deleteAssessment,
  addQuestionToAssessment,
  removeQuestionFromAssessment,
  reorderAssessmentQuestions,
} from '@/lib/actions/assessments';
import { listQuestions } from '@/lib/actions/questions';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  BarChart3,
  GraduationCap,
  Settings,
  X,
  Check,
  Loader2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';

// Assessment state type — matches the shape returned by getAssessment() server action.
// Uses 'any' because this is a client component and Prisma types (Date objects)
// cannot be imported directly. The server action returns raw Prisma data with
// Date objects for DateTime fields, so we use any to avoid type mismatches.
type Assessment = any;

interface BankQuestion {
  id: string;
  type: string;
  prompt: string;
  points: number;
  difficulty: number;
}

export default function AssessmentBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'settings' | 'questions' | 'attempts'>('settings');
  const [editing, setEditing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [editData, setEditData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchAssessment();
  }, [id]);

  async function fetchAssessment() {
    try {
      const data = await getAssessment(id);
      setAssessment(data);
      setEditData({
        title: data.title,
        description: data.description || '',
        timeLimit: data.timeLimit || '',
        openAt: data.openAt ? new Date(data.openAt).toISOString().slice(0, 16) : '',
        closeAt: data.closeAt ? new Date(data.closeAt).toISOString().slice(0, 16) : '',
        attemptsMax: data.attemptsMax,
        shuffleQs: data.shuffleQs,
        showAnswersAfter: data.showAnswersAfter,
      });
    } catch {
      setError('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  }

  // Fetch bank questions for add dialog
  useEffect(() => {
    if (!showAddDialog || !assessment) return;
    listQuestions({ courseId: assessment.courseId })
      .then((data) => setBankQuestions(data.questions || []))
      .catch(() => setBankQuestions([]));
  }, [showAddDialog, assessment]);

  const filteredBankQuestions = bankQuestions.filter(
    (q) => !questionSearch || q.prompt.toLowerCase().includes(questionSearch.toLowerCase())
  );

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateAssessment(id, {
        title: editData.title,
        description: editData.description,
        timeLimit: editData.timeLimit ? parseInt(editData.timeLimit) : undefined,
        openAt: editData.openAt ? new Date(editData.openAt) : undefined,
        closeAt: editData.closeAt ? new Date(editData.closeAt) : undefined,
        attemptsMax: editData.attemptsMax,
        shuffleQs: editData.shuffleQs,
        showAnswersAfter: editData.showAnswersAfter,
      });
      setEditing(false);
      fetchAssessment();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    try {
      if (assessment?.isPublished) {
        await unpublishAssessment(id);
      } else {
        await publishAssessment(id);
      }
      fetchAssessment();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update publish status');
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this assessment? This cannot be undone.')) return;
    try {
      await deleteAssessment(id);
      router.push('/admin/assessments');
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  }

  async function handleAddQuestion(bankQuestionId: string) {
    try {
      await addQuestionToAssessment(id, bankQuestionId);
      setShowAddDialog(false);
      fetchAssessment();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to add question');
    }
  }

  async function handleRemoveQuestion(questionId: string) {
    if (!confirm('Remove this question from the assessment?')) return;
    try {
      await removeQuestionFromAssessment(id, questionId);
      fetchAssessment();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to remove question');
    }
  }

  async function handleMoveQuestion(questionId: string, direction: 'up' | 'down') {
    if (!assessment) return;
    const questions = [...assessment.questions];
    const idx = questions.findIndex((q) => q.id === questionId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === questions.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [questions[idx], questions[swapIdx]] = [questions[swapIdx], questions[idx]];

    try {
      const orderedIds = questions.map((q) => q.id);
      await reorderAssessmentQuestions(id, orderedIds);
      fetchAssessment();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to reorder');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Assessment not found</p>
        <Link href="/admin/assessments" className="text-blue-500 hover:underline mt-2 inline-block">
          Back to assessments
        </Link>
      </div>
    );
  }

  const totalPoints = assessment.questions.reduce((sum: number, q: { points: number }) => sum + q.points, 0);
  const typeColors: Record<string, string> = {
    MULTIPLE_CHOICE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    TRUE_FALSE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    FILL_IN_BLANK: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    SHORT_ANSWER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    NUMERIC: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    MATCHING: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    ESSAY: 'bg-gray-100 text-gray-800 dark:bg-input/30 dark:text-foreground',
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Assessments', href: '/admin/assessments' },
          { label: assessment.title },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/assessments"
            className="p-2 rounded-lg hover:bg-muted transition"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {assessment.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {assessment.course.code} — {assessment.course.title} ·{' '}
              {assessment.type.replace(/_/g, ' ')} · {assessment.mode === 'NATIVE' ? 'Native' : 'External'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {assessment.isPublished ? (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              Published
            </span>
          ) : (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-input/30 dark:text-foreground">
              Draft
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase">Questions</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {assessment.questions.length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase">Total Points</p>
          <p className="text-2xl font-bold text-foreground mt-1">{totalPoints}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase">Attempts</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {assessment.attempts.length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase">Time Limit</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {assessment.timeLimit ? `${assessment.timeLimit}m` : '∞'}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={handlePublish}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            assessment.isPublished
              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {assessment.isPublished ? (
            <>
              <EyeOff className="w-4 h-4" /> Unpublish
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" /> Publish
            </>
          )}
        </button>

        <Link
          href={`/admin/assessments/${id}/grading`}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-foreground border border-gray-300 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-muted transition"
        >
          <GraduationCap className="w-4 h-4" /> Grading
        </Link>

        <Link
          href={`/admin/assessments/${id}/analytics`}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-foreground border border-gray-300 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-muted transition"
        >
          <BarChart3 className="w-4 h-4" /> Analytics
        </Link>

        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition ml-auto"
        >
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-6">
          {[
            { key: 'settings', label: 'Settings', icon: Settings },
            { key: 'questions', label: 'Questions', icon: Edit },
            { key: 'attempts', label: 'Attempts', icon: Eye },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition ${
                tab === t.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Assessment Settings
            </h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-muted text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-muted text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    Time Limit (min)
                  </label>
                  <input
                    type="number"
                    value={editData.timeLimit}
                    onChange={(e) => setEditData({ ...editData, timeLimit: e.target.value })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-muted text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    value={editData.attemptsMax}
                    onChange={(e) => setEditData({ ...editData, attemptsMax: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-muted text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    Show Answers
                  </label>
                  <select
                    value={editData.showAnswersAfter}
                    onChange={(e) => setEditData({ ...editData, showAnswersAfter: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-muted text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="IMMEDIATELY">Immediately</option>
                    <option value="AFTER_DEADLINE">After deadline</option>
                    <option value="MANUALLY">Manually</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    Available From
                  </label>
                  <input
                    type="datetime-local"
                    value={editData.openAt}
                    onChange={(e) => setEditData({ ...editData, openAt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-muted text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
                    Available Until
                  </label>
                  <input
                    type="datetime-local"
                    value={editData.closeAt}
                    onChange={(e) => setEditData({ ...editData, closeAt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-muted text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editShuffleQs"
                  checked={editData.shuffleQs}
                  onChange={(e) => setEditData({ ...editData, shuffleQs: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editShuffleQs" className="text-sm text-gray-700 dark:text-foreground">
                  Shuffle questions for each student
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-foreground border border-gray-300 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-muted transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Title', value: assessment.title },
                { label: 'Type', value: assessment.type.replace(/_/g, ' ') },
                { label: 'Mode', value: assessment.mode === 'NATIVE' ? 'Native Builder' : 'External Form' },
                { label: 'Status', value: assessment.liveStatus },
                { label: 'Time Limit', value: assessment.timeLimit ? `${assessment.timeLimit} min` : 'No limit' },
                { label: 'Max Attempts', value: assessment.attemptsMax },
                { label: 'Shuffle', value: assessment.shuffleQs ? 'Yes' : 'No' },
                { label: 'Show Answers', value: assessment.showAnswersAfter.replace(/_/g, ' ') },
                { label: 'Open At', value: assessment.openAt ? formatDateTime(assessment.openAt) : 'Immediately' },
                { label: 'Close At', value: assessment.closeAt ? formatDateTime(assessment.closeAt) : 'No deadline' },
              ].map(({ label, value }) => (
                <div key={label} className="p-4 bg-gray-50 dark:bg-muted/50 rounded-lg">
                  <dt className="text-xs font-medium text-muted-foreground uppercase">
                    {label}
                  </dt>
                  <dd className="text-foreground mt-1">{value}</dd>
                </div>
              ))}
              {assessment.description && (
                <div className="md:col-span-2 p-4 bg-gray-50 dark:bg-muted/50 rounded-lg">
                  <dt className="text-xs font-medium text-muted-foreground uppercase">
                    Description
                  </dt>
                  <dd className="text-foreground mt-1 whitespace-pre-wrap">
                    {assessment.description}
                  </dd>
                </div>
              )}
              {assessment.mode === 'GOOGLE_FORM' && assessment.formUrl && (
                <div className="md:col-span-2 p-4 bg-gray-50 dark:bg-muted/50 rounded-lg">
                  <dt className="text-xs font-medium text-muted-foreground uppercase">
                    External URL
                  </dt>
                  <dd className="text-foreground mt-1">
                    <a
                      href={assessment.formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center gap-1"
                    >
                      {assessment.formUrl}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      )}

      {/* Questions Tab */}
      {tab === 'questions' && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Questions ({assessment.questions.length})
            </h2>
            {assessment.mode === 'NATIVE' && (
              <button
                onClick={() => setShowAddDialog(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" /> Add Question
              </button>
            )}
          </div>

          {assessment.questions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-2">No questions added yet.</p>
              {assessment.mode === 'NATIVE' && (
                <button
                  onClick={() => setShowAddDialog(true)}
                  className="text-blue-500 hover:underline text-sm"
                >
                  Add questions from the bank
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {assessment.questions.map((q: any, idx: number) => (
                <div
                  key={q.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border"
                >
                  <span className="text-sm font-medium text-gray-400 dark:text-muted-foreground w-8 text-center">
                    {idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveQuestion(q.id, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-muted text-gray-400 disabled:opacity-30 transition"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveQuestion(q.id, 'down')}
                      disabled={idx === assessment.questions.length - 1}
                      className="p-1 rounded hover:bg-muted text-gray-400 disabled:opacity-30 transition"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      typeColors[q.type] || typeColors.ESSAY
                    }`}
                  >
                    {q.type.replace(/_/g, ' ')}
                  </span>
                  <p className="flex-1 text-sm text-foreground truncate">
                    {q.prompt}
                  </p>
                  <span className="text-xs text-muted-foreground">{q.points} pts</span>
                  <button
                    onClick={() => handleRemoveQuestion(q.id)}
                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attempts Tab */}
      {tab === 'attempts' && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Recent Attempts
          </h2>

          {assessment.attempts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No attempts yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Student
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Score
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Percentage
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {assessment.attempts.map((attempt: any) => (
                    <tr key={attempt.id} className="hover:bg-muted">
                      <td className="px-4 py-3 text-sm text-foreground">
                        {attempt.user?.firstName || 'Unknown'} ({attempt.user?.email || '—'})
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-foreground">
                        {attempt.score !== null && attempt.score !== undefined
                          ? `${attempt.score}/${attempt.totalPoints}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-foreground">
                        {attempt.percentage !== null && attempt.percentage !== undefined
                          ? `${attempt.percentage}%`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {attempt.submittedAt
                          ? formatDateTime(attempt.submittedAt)
                          : 'In progress'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Question Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[80vh] flex flex-col m-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Add Question from Bank
              </h3>
              <button
                onClick={() => setShowAddDialog(false)}
                className="p-1.5 rounded-md hover:bg-muted text-gray-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <input
                type="text"
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                placeholder="Search questions..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-muted text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredBankQuestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No questions found.{' '}
                  <Link href="/admin/questions/new" className="text-blue-500 hover:underline">
                    Create one
                  </Link>
                  .
                </div>
              ) : (
                filteredBankQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-blue-300 dark:hover:border-blue-700 transition"
                  >
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        typeColors[q.type] || typeColors.ESSAY
                      }`}
                    >
                      {q.type.replace(/_/g, ' ')}
                    </span>
                    <p className="flex-1 text-sm text-foreground truncate">
                      {q.prompt}
                    </p>
                    <span className="text-xs text-muted-foreground">{q.points} pts</span>
                    <button
                      onClick={() => handleAddQuestion(q.id)}
                      className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
