'use client';

// Assessment creation wizard — multi-step form
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createAssessment } from '@/lib/actions/assessments';
import { listQuestions } from '@/lib/actions/questions';
import { DataSelect } from '@/components/ui/data-select';
import { InstitutionSelect } from '@/components/ui/selects/institution-select';
import { ProgrammeSelect } from '@/components/ui/selects/programme-select';
import { CourseSelect } from '@/components/ui/selects/course-select';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ClipboardList,
  ExternalLink,
  Loader2,
} from 'lucide-react';

type AssessmentMode = 'NATIVE' | 'GOOGLE_FORM';
type AssessmentType = 'QUIZ' | 'TEST' | 'EXAM' | 'ASSIGNMENT' | 'PRACTICE';

interface Course {
  id: string;
  code: string;
  title: string;
}

interface University {
  id: string;
  name: string;
  code: string;
  academicSystem: 'YEARLY' | 'SEMESTERLY' | 'TRIMESTERLY';
}

interface BankQuestion {
  id: string;
  type: string;
  prompt: string;
  points: number;
  difficulty: number;
}

interface Step1Data {
  mode: AssessmentMode;
}

interface Step2Data {
  title: string;
  description: string;
  type: AssessmentType;
  institutionId: string;
  programmeId: string;
  year: number;
  period: string;
  courseId: string;
  timeLimit: string;
  openAt: string;
  closeAt: string;
  attemptsMax: string;
  shuffleQs: boolean;
  showAnswersAfter: 'IMMEDIATELY' | 'AFTER_DEADLINE' | 'MANUALLY';
}

interface Step3aData {
  questionIds: string[];
}

interface Step3bData {
  embedUrl: string;
  formUrl: string;
}

const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'TEST', label: 'Test' },
  { value: 'EXAM', label: 'Exam' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'PRACTICE', label: 'Practice' },
];

export default function NewAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Source
  const [step1, setStep1] = useState<Step1Data>({ mode: 'NATIVE' });

  // Step 2: Basic info
  const [step2, setStep2] = useState<Step2Data>({
    title: '',
    description: '',
    type: 'QUIZ',
    institutionId: '',
    programmeId: '',
    year: 1,
    period: '',
    courseId: '',
    timeLimit: '',
    openAt: '',
    closeAt: '',
    attemptsMax: '1',
    shuffleQs: true,
    showAnswersAfter: 'IMMEDIATELY',
  });

  // Step 3a: Native builder
  const [step3a, setStep3a] = useState<Step3aData>({ questionIds: [] });

  // Step 3b: External config
  const [step3b, setStep3b] = useState<Step3bData>({
    embedUrl: '',
    formUrl: '',
  });

  // Data
  const [universities, setUniversities] = useState<University[]>([]);
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionTypeFilter, setQuestionTypeFilter] = useState('');

  // Load universities for academic system lookup
  useEffect(() => {
    async function loadUniversities() {
      try {
        const res = await fetch('/api/admin/universities');
        if (res.ok) {
          const data = await res.json();
          setUniversities(data);
        }
      } catch {
        console.error('Failed to load universities');
      }
    }
    loadUniversities();
  }, []);

  // Get period options based on selected university's academic system
  const getPeriodOptions = () => {
    const uni = universities.find((u) => u.id === step2.institutionId);
    if (!uni) return [];
    switch (uni.academicSystem) {
      case 'YEARLY':
        return [{ value: '', label: 'Full Year' }];
      case 'SEMESTERLY':
        return [
          { value: '1', label: 'Semester 1' },
          { value: '2', label: 'Semester 2' },
        ];
      case 'TRIMESTERLY':
        return [
          { value: '1', label: 'Trimester 1' },
          { value: '2', label: 'Trimester 2' },
          { value: '3', label: 'Trimester 3' },
        ];
      default:
        return [];
    }
  };

  // Fetch bank questions when course is selected
  useEffect(() => {
    if (!step2.courseId) {
      setBankQuestions([]);
      return;
    }
    listQuestions({ courseId: step2.courseId })
      .then((data) => setBankQuestions(data.questions || []))
      .catch(() => setBankQuestions([]));
  }, [step2.courseId]);

  const filteredQuestions = bankQuestions.filter((q) => {
    const matchesSearch =
      !questionSearch ||
      q.prompt.toLowerCase().includes(questionSearch.toLowerCase());
    const matchesType =
      !questionTypeFilter || q.type === questionTypeFilter;
    return matchesSearch && matchesType;
  });

  const toggleQuestion = (id: string) => {
    setStep3a((prev) => ({
      ...prev,
      questionIds: prev.questionIds.includes(id)
        ? prev.questionIds.filter((qid) => qid !== id)
        : [...prev.questionIds, id],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return step2.title.trim().length >= 3 && step2.courseId;
      case 3:
        if (step1.mode === 'NATIVE') return true;
        return step3b.embedUrl.trim() || step3b.formUrl.trim();
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed()) setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const isNative = step1.mode === 'NATIVE';

      const data = {
        title: step2.title,
        description: step2.description || undefined,
        type: step2.type,
        courseId: step2.courseId,
        mode: step1.mode,
        timeLimit: step2.timeLimit ? parseInt(step2.timeLimit) : undefined,
        openAt: step2.openAt ? new Date(step2.openAt) : undefined,
        closeAt: step2.closeAt ? new Date(step2.closeAt) : undefined,
        attemptsMax: parseInt(step2.attemptsMax) || 1,
        shuffleQs: step2.shuffleQs,
        showAnswersAfter: step2.showAnswersAfter,
        isPublished: false,
        questionIds: isNative ? step3a.questionIds : undefined,
        embedUrl: !isNative ? step3b.embedUrl || null : null,
        formUrl: !isNative ? step3b.formUrl || null : null,
      };

      const result = await createAssessment(data);
      if (result.assessmentId) {
        router.push(`/admin/assessments/${result.assessmentId}`);
      } else {
        setError('Failed to create assessment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = step3a.questionIds
    .map((id) => bankQuestions.find((q) => q.id === id)?.points || 0)
    .reduce((sum, pts) => sum + pts, 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Create New Assessment
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Build a quiz, test, exam, or assignment
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {['Source', 'Basic Info', step1.mode === 'NATIVE' ? 'Questions' : 'External URL', 'Review'].map(
            (label, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i + 1 < step
                      ? 'bg-green-500 text-white'
                      : i + 1 === step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`ml-2 text-sm hidden sm:inline ${
                    i + 1 <= step
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {label}
                </span>
              </div>
            )
          )}
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Source Chooser */}
      {step === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Choose Assessment Source
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Will you build this assessment with our native question builder, or
            embed an external form?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setStep1({ mode: 'NATIVE' })}
              className={`p-6 rounded-xl border-2 text-left transition ${
                step1.mode === 'NATIVE'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <ClipboardList className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                Native Builder
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Build from your question bank with multiple choice, essays,
                matching, and more.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStep1({ mode: 'GOOGLE_FORM' })}
              className={`p-6 rounded-xl border-2 text-left transition ${
                step1.mode === 'GOOGLE_FORM'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <ExternalLink className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                External Form
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Embed a Google Form, Microsoft Form, or any external assessment
                URL.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Basic Info */}
      {step === 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={step2.title}
                onChange={(e) => setStep2({ ...step2, title: e.target.value })}
                placeholder="e.g. Midterm Exam — Week 6"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={step2.description}
                onChange={(e) =>
                  setStep2({ ...step2, description: e.target.value })
                }
                placeholder="Instructions for students..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type *
                </label>
                <select
                  value={step2.type}
                  onChange={(e) =>
                    setStep2({ ...step2, type: e.target.value as AssessmentType })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ASSESSMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <InstitutionSelect
                value={step2.institutionId}
                onChange={(v) => setStep2({ ...step2, institutionId: v, programmeId: '', period: '', courseId: '' })}
                label="University *"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProgrammeSelect
                institutionId={step2.institutionId}
                value={step2.programmeId}
                onChange={(v) => setStep2({ ...step2, programmeId: v, courseId: '' })}
                label="Programme *"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Year *
                </label>
                <select
                  value={step2.year}
                  onChange={(e) => setStep2({ ...step2, year: parseInt(e.target.value), courseId: '' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((y) => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Period *
                </label>
                <select
                  value={step2.period}
                  onChange={(e) => setStep2({ ...step2, period: e.target.value, courseId: '' })}
                  disabled={!step2.institutionId}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">Select period</option>
                  {getPeriodOptions().map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <CourseSelect
                programmeId={step2.programmeId}
                universityId={step2.institutionId}
                year={step2.year}
                period={step2.period}
                value={step2.courseId}
                onChange={(v) => setStep2({ ...step2, courseId: v })}
                label="Course *"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  value={step2.timeLimit}
                  onChange={(e) =>
                    setStep2({ ...step2, timeLimit: e.target.value })
                  }
                  placeholder="e.g. 60"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Attempts
                </label>
                <input
                  type="number"
                  value={step2.attemptsMax}
                  onChange={(e) =>
                    setStep2({ ...step2, attemptsMax: e.target.value })
                  }
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Show Answers
                </label>
                <select
                  value={step2.showAnswersAfter}
                  onChange={(e) =>
                    setStep2({
                      ...step2,
                      showAnswersAfter: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="IMMEDIATELY">Immediately</option>
                  <option value="AFTER_DEADLINE">After deadline</option>
                  <option value="MANUALLY">Manually</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Available From
                </label>
                <input
                  type="datetime-local"
                  value={step2.openAt}
                  onChange={(e) =>
                    setStep2({ ...step2, openAt: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Available Until
                </label>
                <input
                  type="datetime-local"
                  value={step2.closeAt}
                  onChange={(e) =>
                    setStep2({ ...step2, closeAt: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="shuffleQs"
                checked={step2.shuffleQs}
                onChange={(e) =>
                  setStep2({ ...step2, shuffleQs: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="shuffleQs"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Shuffle questions for each student
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Step 3a: Native Builder */}
      {step === 3 && step1.mode === 'NATIVE' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Select Questions
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
            Choose questions from the bank for the selected course.{' '}
            {step3a.questionIds.length} selected, {totalPoints} total points.
          </p>

          {step2.courseId ? (
            <>
              {/* Search & filter */}
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  placeholder="Search questions..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={questionTypeFilter}
                  onChange={(e) => setQuestionTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All types</option>
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="TRUE_FALSE">True/False</option>
                  <option value="FILL_IN_BLANK">Fill in Blank</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="NUMERIC">Numeric</option>
                  <option value="MATCHING">Matching</option>
                  <option value="ESSAY">Essay</option>
                </select>
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No questions found. Create questions in the{' '}
                  <a
                    href="/admin/questions/new"
                    className="text-blue-500 hover:underline"
                  >
                    question bank
                  </a>
                  .
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredQuestions.map((q) => (
                    <label
                      key={q.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        step3a.questionIds.includes(q.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={step3a.questionIds.includes(q.id)}
                        onChange={() => toggleQuestion(q.id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {q.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {q.points} pts
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {'★'.repeat(q.difficulty)}
                            {'☆'.repeat(5 - q.difficulty)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {q.prompt}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Select a course in the previous step to see available questions.
            </div>
          )}
        </div>
      )}

      {/* Step 3b: External Config */}
      {step === 3 && step1.mode === 'GOOGLE_FORM' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            External Form Configuration
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Embed URL
              </label>
              <input
                type="url"
                value={step3b.embedUrl}
                onChange={(e) =>
                  setStep3b({ ...step3b, embedUrl: e.target.value })
                }
                placeholder="https://docs.google.com/forms/d/.../viewform?embedded=true"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The URL that will be embedded in an iframe. For Google Forms,
                append <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">?embedded=true</code> to the form URL.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Form URL
              </label>
              <input
                type="url"
                value={step3b.formUrl}
                onChange={(e) =>
                  setStep3b({ ...step3b, formUrl: e.target.value })
                }
                placeholder="https://forms.gle/..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The direct link students can open in a new tab.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Review & Create
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Title
              </dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium mt-1">
                {step2.title}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </dt>
                <dd className="text-gray-900 dark:text-gray-100 mt-1">
                  {step2.type.replace(/_/g, ' ')}
                </dd>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Source
                </dt>
                <dd className="text-gray-900 dark:text-gray-100 mt-1">
                  {step1.mode === 'NATIVE' ? 'Native Builder' : 'External Form'}
                </dd>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Course
                </dt>
                <dd className="text-gray-900 dark:text-gray-100 mt-1">
                  {step2.courseId ? `Course ID: ${step2.courseId}` : 'Not selected'}
                </dd>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Time Limit
                </dt>
                <dd className="text-gray-900 dark:text-gray-100 mt-1">
                  {step2.timeLimit ? `${step2.timeLimit} min` : 'No limit'}
                </dd>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Max Attempts
                </dt>
                <dd className="text-gray-900 dark:text-gray-100 mt-1">
                  {step2.attemptsMax}
                </dd>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Shuffle
                </dt>
                <dd className="text-gray-900 dark:text-gray-100 mt-1">
                  {step2.shuffleQs ? 'Yes' : 'No'}
                </dd>
              </div>
            </div>

            {step1.mode === 'NATIVE' && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Questions
                </dt>
                <dd className="text-gray-900 dark:text-gray-100 mt-1">
                  {step3a.questionIds.length} questions selected ({totalPoints}{' '}
                  total points)
                </dd>
                {step3a.questionIds.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {step3a.questionIds.map((id) => {
                      const q = bankQuestions.find((bq) => bq.id === id);
                      return q ? (
                        <li
                          key={id}
                          className="text-sm text-gray-600 dark:text-gray-400 truncate"
                        >
                          • {q.prompt}
                        </li>
                      ) : null;
                    })}
                  </ul>
                )}
              </div>
            )}

            {step1.mode === 'GOOGLE_FORM' && step3b.embedUrl && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Embed URL
                </dt>
                <dd className="text-gray-900 dark:text-gray-100 mt-1 break-all">
                  {step3b.embedUrl}
                </dd>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <Link
            href="/admin/assessments"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Link>
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Create Assessment
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
