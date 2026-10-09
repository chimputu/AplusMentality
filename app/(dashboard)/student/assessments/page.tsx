// app/(dashboard)/student/assessments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileCheck,
  FileQuestion,
  ClipboardList,
  GraduationCap,
  Play,
  RotateCcw,
  Award,
  Clock,
  ExternalLink,
} from 'lucide-react';

type AssessmentMode = 'GOOGLE_FORM' | 'NATIVE';
type AssessmentType = 'QUIZ' | 'TEST' | 'EXAM' | 'ASSIGNMENT';

interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  mode: AssessmentMode;
  isPublished: boolean;
  formUrl: string | null;
  attemptsMax: number;
  passingScore: number;
  timeLimit: number | null;
  dueDate: string | null;
  courseId: string;
  course: {
    id: string;
    code: string;
    title: string;
  };
  _count: {
    questions: number;
    attempts: number;
  };
  attempts: Array<{
    id: string;
    score: number | null;
    percentage: number | null;
    passed: boolean | null;
    isBest: boolean;
    submittedAt: string | null;
  }>;
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

export default function StudentAssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, []);

  async function fetchAssessments() {
    const res = await fetch('/api/student/assessments');
    if (res.ok) {
      const data = await res.json();
      setAssessments(data);
    }
    setLoading(false);
  }

  function handleStart(assessmentId: string) {
    router.push(`/assessments/${assessmentId}`);
  }

  function handleOpenForm(formUrl: string) {
    window.open(formUrl, '_blank');
  }

  function getBestAttempt(assessment: Assessment) {
    return assessment.attempts.find(a => a.isBest) || assessment.attempts[0] || null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assessments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {assessments.length} assessments available
        </p>
      </div>

      {/* Assessments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <FileCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No assessments available</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Check back later for new assessments.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map(assessment => {
            const TypeIcon = typeIcons[assessment.type] || FileCheck;
            const bestAttempt = getBestAttempt(assessment);

            return (
              <div
                key={assessment.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TypeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {assessment.title}
                      </h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span>{typeLabels[assessment.type]}</span>
                        <span>·</span>
                        <span>{assessment.course?.code} {assessment.course?.title}</span>
                        <span>·</span>
                        <span>{assessment._count.questions} questions</span>
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center space-x-4 text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {assessment.timeLimit && (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{assessment.timeLimit} min</span>
                          </span>
                        )}
                        {assessment.dueDate && (
                          <span>Due: {new Date(assessment.dueDate).toLocaleDateString()}</span>
                        )}
                        <span>Max attempts: {assessment.attemptsMax || '∞'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center space-x-2">
                    {bestAttempt?.submittedAt && (
                      <div className="text-right mr-3">
                        {bestAttempt.percentage !== null && (
                          <div className="flex items-center space-x-1 text-sm">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span className={`font-semibold ${
                              bestAttempt.passed
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {bestAttempt.percentage}%
                            </span>
                          </div>
                        )}
                        <span className="text-xs text-gray-400 dark:text-gray-500">Best score</span>
                      </div>
                    )}

                    {assessment.mode === 'NATIVE' ? (
                      <button
                        onClick={() => handleStart(assessment.id)}
                        className="flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2 text-sm transition"
                      >
                        {bestAttempt?.submittedAt ? (
                          <>
                            <RotateCcw className="w-4 h-4" />
                            <span>Retake</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span>Start</span>
                          </>
                        )}
                      </button>
                    ) : (
                      assessment.formUrl && (
                        <button
                          onClick={() => handleOpenForm(assessment.formUrl!)}
                          className="flex items-center space-x-2 bg-green-600 text-white hover:bg-green-700 rounded-lg px-4 py-2 text-sm transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Open Form</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Mode Badge */}
                <div className="mt-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    assessment.mode === 'NATIVE'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}>
                    {assessment.mode === 'NATIVE' ? 'Native' : 'Google Form'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
