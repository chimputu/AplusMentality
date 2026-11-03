// app/(dashboard)/admin/assessments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Plus,
  FileText,
  Eye,
  Trash2,
  Filter,
  ClipboardList,
  FileQuestion,
  GraduationCap,
} from 'lucide-react';

type AssessmentMode = 'GOOGLE_FORM' | 'NATIVE';
type AssessmentType = 'QUIZ' | 'TEST' | 'EXAM' | 'ASSIGNMENT';

interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  mode: AssessmentMode;
  liveStatus: string;
  isPublished: boolean;
  courseId: string;
  course: {
    id: string;
    code: string;
    title: string;
  };
  _count: {
    attempts: number;
    formResponses: number;
    questions: number;
  };
  createdAt: string;
}

const typeIcons: Record<AssessmentType, any> = {
  QUIZ: FileQuestion,
  TEST: FileCheck,
  EXAM: GraduationCap,
  ASSIGNMENT: ClipboardList,
};

const typeLabels: Record<AssessmentType, string> = {
  QUIZ: 'Quiz',
  TEST: 'Test',
  EXAM: 'Exam',
  ASSIGNMENT: 'Assignment',
};

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('');

  useEffect(() => {
    fetchAssessments();
  }, [filterType, filterMode]);

  async function fetchAssessments() {
    const qs = new URLSearchParams();
    if (filterType) qs.set('type', filterType);
    if (filterMode) qs.set('mode', filterMode);

    const res = await fetch(`/api/admin/assessments?${qs}`);
    if (res.ok) {
      const data = await res.json();
      setAssessments(data);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this assessment?')) return;
    const res = await fetch(`/api/admin/assessments/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setAssessments(prev => prev.filter(a => a.id !== id));
    }
  }

  const totalSubmissions = assessments.reduce(
    (sum, a) => sum + a._count.attempts + a._count.formResponses, 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assessments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {assessments.length} assessments · {totalSubmissions} total submissions
          </p>
        </div>
        <Link
          href="/admin/assessments/new"
          className="flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Assessment</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Filters:</span>
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-card dark:border-border dark:text-foreground"
        >
          <option value="">All Types</option>
          <option value="QUIZ">Quiz</option>
          <option value="TEST">Test</option>
          <option value="EXAM">Exam</option>
          <option value="ASSIGNMENT">Assignment</option>
        </select>
        <select
          value={filterMode}
          onChange={e => setFilterMode(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-card dark:border-border dark:text-foreground"
        >
          <option value="">All Modes</option>
          <option value="NATIVE">Native</option>
          <option value="GOOGLE_FORM">Google Form</option>
        </select>
      </div>

      {/* Assessments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <FileCheck className="w-12 h-12 text-gray-300 dark:text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-muted-foreground">No assessments yet</h3>
          <p className="text-sm text-gray-400 dark:text-muted-foreground mt-1">
            Create your first assessment to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map(assessment => {
            const TypeIcon = typeIcons[assessment.type] || FileCheck;
            return (
              <div
                key={assessment.id}
                className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:shadow-sm transition"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <TypeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {assessment.title}
                    </h3>
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground mt-1">
                      <span>{typeLabels[assessment.type]}</span>
                      <span>·</span>
                      <span>{assessment.course?.code} {assessment.course?.title}</span>
                      <span>·</span>
                      <span>{assessment._count.questions} questions</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Mode Badge */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    assessment.mode === 'NATIVE'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}>
                    {assessment.mode === 'NATIVE' ? 'Native' : 'Google Form'}
                  </span>

                  {/* Status Badge */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    assessment.isPublished
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-muted text-gray-600 dark:text-muted-foreground'
                  }`}>
                    {assessment.isPublished ? 'Published' : 'Draft'}
                  </span>

                  {/* Submissions count */}
                  <span className="text-sm text-muted-foreground">
                    {assessment._count.attempts + assessment._count.formResponses} submissions
                  </span>

                  {/* Actions */}
                  <Link
                    href={`/admin/assessments/${assessment.id}/submissions`}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                    title="View submissions"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(assessment.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
