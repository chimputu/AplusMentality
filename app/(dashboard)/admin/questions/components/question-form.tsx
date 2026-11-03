'use client';

// Dynamic question form — adapts fields based on selected question type
import { useState, useEffect } from 'react';
import { QuestionType } from '@/generated/prisma/client';

interface QuestionOption {
  id?: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

interface QuestionFormProps {
  question?: any;
  onSubmit: (data: any) => Promise<void>;
}

const QUESTION_TYPES: QuestionType[] = [
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'FILL_IN_BLANK',
  'SHORT_ANSWER',
  'NUMERIC',
  'MATCHING',
  'ESSAY',
];

export function QuestionForm({ question, onSubmit }: QuestionFormProps) {
  const [type, setType] = useState<QuestionType>(question?.type || 'MULTIPLE_CHOICE');
  const [prompt, setPrompt] = useState(question?.prompt || '');
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [points, setPoints] = useState(question?.points || 1);
  const [difficulty, setDifficulty] = useState(question?.difficulty || 1);
  const [options, setOptions] = useState<QuestionOption[]>(
    question?.questionOptions?.map((o: any) => ({
      id: o.id,
      text: o.text,
      isCorrect: o.isCorrect,
      order: o.order,
    })) || [{ text: '', isCorrect: false, order: 0 }, { text: '', isCorrect: false, order: 1 }]
  );
  const [acceptedAnswers, setAcceptedAnswers] = useState(
    question?.correctText ? [question.correctText] : ['']
  );
  const [correctNumber, setCorrectNumber] = useState(question?.correctNumber ?? '');
  const [tolerance, setTolerance] = useState(question?.tolerance ?? '');
  const [matchingPairs, setMatchingPairs] = useState(
    question?.matchingPairs || [{ left: '', right: '' }, { left: '', right: '' }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data: any = {
        type,
        prompt,
        explanation,
        points,
        difficulty,
        tags: [],
      };

      if (type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE') {
        data.options = options.map((o, i) => ({ ...o, order: i }));
      }
      if (type === 'FILL_IN_BLANK' || type === 'SHORT_ANSWER') {
        data.acceptedAnswers = acceptedAnswers.filter((a) => a.trim());
      }
      if (type === 'NUMERIC') {
        data.correctNumber = parseFloat(correctNumber as string);
        data.tolerance = parseFloat(tolerance as string) || 0;
      }
      if (type === 'MATCHING') {
        data.matchingPairs = matchingPairs.filter((p: any) => p.left.trim() && p.right.trim());
      }

      await onSubmit(data);
    } catch (err: any) {
      setError(err.message || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setOptions([...options, { text: '', isCorrect: false, order: options.length }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof QuestionOption, value: string | boolean) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    // If setting isCorrect, uncheck others
    if (field === 'isCorrect' && value === true) {
      updated.forEach((o, i) => {
        if (i !== index) o.isCorrect = false;
      });
    }
    setOptions(updated);
  };

  const addAcceptedAnswer = () => {
    setAcceptedAnswers([...acceptedAnswers, '']);
  };

  const removeAcceptedAnswer = (index: number) => {
    setAcceptedAnswers(acceptedAnswers.filter((_, i) => i !== index));
  };

  const updateAcceptedAnswer = (index: number, value: string) => {
    const updated = [...acceptedAnswers];
    updated[index] = value;
    setAcceptedAnswers(updated);
  };

  const addMatchingPair = () => {
    setMatchingPairs([...matchingPairs, { left: '', right: '' }]);
  };

  const removeMatchingPair = (index: number) => {
    if (matchingPairs.length <= 2) return;
    setMatchingPairs(matchingPairs.filter((_p: any, i: number) => i !== index));
  };

  const updateMatchingPair = (index: number, field: 'left' | 'right', value: string) => {
    const updated = [...matchingPairs];
    updated[index] = { ...updated[index], [field]: value };
    setMatchingPairs(updated);
  };

  // When type changes to TRUE_FALSE, set default options
  useEffect(() => {
    if (type === 'TRUE_FALSE' && options.length === 0) {
      setOptions([
        { text: 'True', isCorrect: false, order: 0 },
        { text: 'False', isCorrect: false, order: 1 },
      ]);
    }
  }, [type]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Question Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
          Question Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as QuestionType)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg bg-card text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
          Question Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg bg-card text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Points & Difficulty */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
            Points
          </label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
            min={1}
            className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg bg-card text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
            Difficulty (1-5)
          </label>
          <input
            type="number"
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value) || 1)}
            min={1}
            max={5}
            className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg bg-card text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Type-specific fields */}
      {(type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">
            Options (select the correct answer)
          </label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctOption"
                  checked={opt.isCorrect}
                  onChange={() => updateOption(i, 'isCorrect', true)}
                  className="text-blue-600"
                />
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => updateOption(i, 'text', e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-border rounded-lg bg-card text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="p-2 text-gray-400 hover:text-red-500 transition"
                  disabled={options.length <= 2}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            + Add Option
          </button>
        </div>
      )}

      {(type === 'FILL_IN_BLANK' || type === 'SHORT_ANSWER') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">
            Accepted Answers
          </label>
          <div className="space-y-2">
            {acceptedAnswers.map((ans, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={ans}
                  onChange={(e) => updateAcceptedAnswer(i, e.target.value)}
                  placeholder={`Accepted answer ${i + 1}`}
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-border rounded-lg bg-card text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => removeAcceptedAnswer(i)}
                  className="p-2 text-gray-400 hover:text-red-500 transition"
                  disabled={acceptedAnswers.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addAcceptedAnswer}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            + Add Answer
          </button>
        </div>
      )}

      {type === 'NUMERIC' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
              Correct Number
            </label>
            <input
              type="number"
              step="any"
              value={correctNumber}
              onChange={(e) => setCorrectNumber(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg bg-card text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
              Tolerance (optional)
            </label>
            <input
              type="number"
              step="any"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg bg-card text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {type === 'MATCHING' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">
            Matching Pairs
          </label>
          <div className="space-y-2">
            {matchingPairs.map((pair: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={pair.left}
                  onChange={(e) => updateMatchingPair(i, 'left', e.target.value)}
                  placeholder="Left"
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-border rounded-lg bg-card text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-400">→</span>
                <input
                  type="text"
                  value={pair.right}
                  onChange={(e) => updateMatchingPair(i, 'right', e.target.value)}
                  placeholder="Right"
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-border rounded-lg bg-card text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => removeMatchingPair(i)}
                  className="p-2 text-gray-400 hover:text-red-500 transition"
                  disabled={matchingPairs.length <= 2}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addMatchingPair}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            + Add Pair
          </button>
        </div>
      )}

      {type === 'ESSAY' && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          ⚠️ Essay questions require manual grading. Students will see a text area to write their response.
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-1">
          Explanation (optional, shown after submission)
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg bg-card text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 border border-gray-300 dark:border-border rounded-lg text-sm text-gray-700 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : question ? 'Update Question' : 'Create Question'}
        </button>
      </div>
    </form>
  );
}
