'use client';

// Client-side assessment runner with timer, auto-save, and question navigation
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { startAttempt, saveAnswer, submitAttempt } from '@/lib/actions/attempts';
import { toast } from 'sonner';
import { Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface Question {
  id: string;
  type: string;
  prompt: string;
  points: number;
  order: number;
}

interface Assessment {
  id: string;
  title: string;
  type: string;
  questions: Question[];
}

interface AssessmentRunnerProps {
  assessment: Assessment;
  attemptId: string | null;
  timeLimit: number | null;
}

export default function AssessmentRunner({
  assessment,
  attemptId: initialAttemptId,
  timeLimit,
}: AssessmentRunnerProps) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<string | null>(initialAttemptId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [secondsLeft, setSecondsLeft] = useState(timeLimit ? timeLimit * 60 : null);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questions = assessment.questions.sort((a, b) => a.order - b.order);
  const currentQuestion = questions[currentIndex];

  // ── Start attempt if needed ──
  useEffect(() => {
    if (!attemptId) {
      startAttempt(assessment.id)
        .then((res) => setAttemptId(res.attemptId))
        .catch(() => toast.error('Could not start assessment'));
    }
  }, [attemptId, assessment.id]);

  // ── Timer countdown ──
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  // ── Auto-submit when time runs out ──
  useEffect(() => {
    if (secondsLeft === 0 && attemptId) {
      handleSubmit();
    }
  }, [secondsLeft]);

  // ── Leave protection ──
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (attemptId && !submitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [attemptId, submitting]);

  // ── Auto-save with debounce ──
  const debouncedSave = useCallback(
    (questionId: string, answer: any) => {
      if (!attemptId) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      setSaving(questionId);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveAnswer({ attemptId, questionId, ...answer });
        } catch {
          toast.error('Failed to save answer');
        } finally {
          setSaving(null);
        }
      }, 1000);
    },
    [attemptId]
  );

  // ── Handle answer change ──
  const handleAnswer = (field: string, value: any) => {
    if (!currentQuestion) return;
    const newAnswer = { ...answers[currentQuestion.id], [field]: value };
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: newAnswer }));
    debouncedSave(currentQuestion.id, newAnswer);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!attemptId || submitting) return;
    if (!confirm('Are you sure you want to submit?')) return;

    setSubmitting(true);
    try {
      const result = await submitAttempt(attemptId);
      toast.success(
        `Assessment submitted! Score: ${result.score}/${result.totalPoints} (${result.percentage.toFixed(1)}%)`
      );
      router.push(`/assessments/${assessment.id}/result?attemptId=${result.attemptId}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
      setSubmitting(false);
    }
  };

  // ── Format time ──
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!attemptId || !currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Loading assessment...</p>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
            {assessment.title}
          </h2>
          {secondsLeft !== null && (
            <div
              className={`flex items-center gap-1 text-sm font-mono ${
                secondsLeft < 300
                  ? 'text-red-600 dark:text-red-400'
                  : secondsLeft < 600
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              {formatTime(secondsLeft)}
            </div>
          )}
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question navigator */}
      <div className="flex flex-wrap gap-1 mb-6">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(i)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
              i === currentIndex
                ? 'bg-blue-600 text-white'
                : answers[q.id]
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
          </span>
        </div>

        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
          {currentQuestion.prompt}
        </h3>

        {/* Render answer input based on type */}
        <div className="space-y-3">
          {(currentQuestion.type === 'MULTIPLE_CHOICE' || currentQuestion.type === 'TRUE_FALSE') && (
            <div className="space-y-2">
              {['A', 'B', 'C', 'D', 'E', 'F'].map((label, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    answers[currentQuestion.id]?.selectedOptionId === `opt-${i}`
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`answer-${currentQuestion.id}`}
                    checked={answers[currentQuestion.id]?.selectedOptionId === `opt-${i}`}
                    onChange={() => handleAnswer('selectedOptionId', `opt-${i}`)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {label}. (Option {label})
                  </span>
                </label>
              ))}
            </div>
          )}

          {(currentQuestion.type === 'FILL_IN_BLANK' ||
            currentQuestion.type === 'SHORT_ANSWER' ||
            currentQuestion.type === 'ESSAY') && (
            <textarea
              value={answers[currentQuestion.id]?.textAnswer || ''}
              onChange={(e) => handleAnswer('textAnswer', e.target.value)}
              rows={currentQuestion.type === 'ESSAY' ? 6 : 2}
              placeholder="Type your answer..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}

          {currentQuestion.type === 'NUMERIC' && (
            <input
              type="number"
              step="any"
              value={answers[currentQuestion.id]?.numericAnswer ?? ''}
              onChange={(e) => handleAnswer('numericAnswer', parseFloat(e.target.value))}
              placeholder="Enter a number..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}

          {saving === currentQuestion.id && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Saving...
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
