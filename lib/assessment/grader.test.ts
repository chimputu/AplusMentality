import { describe, it, expect } from 'vitest';
import { gradeAnswer, gradeAttempt } from './grader';

describe('gradeAnswer', () => {
  // ── MULTIPLE_CHOICE ──
  describe('MULTIPLE_CHOICE', () => {
    it('returns correct when selectedOptionId matches correctOptionId', () => {
      const result = gradeAnswer(
        { type: 'MULTIPLE_CHOICE', points: 2, correctOptionId: 'opt-1' },
        { selectedOptionId: 'opt-1' }
      );
      expect(result).toEqual({
        isCorrect: true,
        pointsEarned: 2,
        feedback: undefined,
      });
    });

    it('returns wrong when selectedOptionId does not match', () => {
      const result = gradeAnswer(
        { type: 'MULTIPLE_CHOICE', points: 2, correctOptionId: 'opt-1' },
        { selectedOptionId: 'opt-2' }
      );
      expect(result).toEqual({ isCorrect: false, pointsEarned: 0, feedback: undefined });
    });

    it('returns wrong when no answer provided', () => {
      const result = gradeAnswer(
        { type: 'MULTIPLE_CHOICE', points: 1, correctOptionId: 'opt-1' },
        {}
      );
      expect(result).toEqual({ isCorrect: false, pointsEarned: 0, feedback: undefined });
    });

    it('checks via options array when correctOptionId is not set', () => {
      const result = gradeAnswer(
        {
          type: 'MULTIPLE_CHOICE',
          points: 3,
          options: [
            { id: 'a', text: 'A', isCorrect: false },
            { id: 'b', text: 'B', isCorrect: true },
          ],
        },
        { selectedOptionId: 'b' }
      );
      expect(result).toEqual({ isCorrect: true, pointsEarned: 3, feedback: undefined });
    });
  });

  // ── TRUE_FALSE ──
  describe('TRUE_FALSE', () => {
    it('returns correct for true/false', () => {
      const result = gradeAnswer(
        { type: 'TRUE_FALSE', points: 1, correctOptionId: 'true' },
        { selectedOptionId: 'true' }
      );
      expect(result).toEqual({ isCorrect: true, pointsEarned: 1, feedback: undefined });
    });

    it('returns wrong for false answer', () => {
      const result = gradeAnswer(
        { type: 'TRUE_FALSE', points: 1, correctOptionId: 'true' },
        { selectedOptionId: 'false' }
      );
      expect(result).toEqual({ isCorrect: false, pointsEarned: 0, feedback: undefined });
    });
  });

  // ── FILL_IN_BLANK ──
  describe('FILL_IN_BLANK', () => {
    it('matches exact answer', () => {
      const result = gradeAnswer(
        { type: 'FILL_IN_BLANK', points: 2, acceptedAnswers: ['Paris'] },
        { textAnswer: 'Paris' }
      );
      expect(result).toEqual({ isCorrect: true, pointsEarned: 2, feedback: undefined });
    });

    it('matches case-insensitive', () => {
      const result = gradeAnswer(
        { type: 'FILL_IN_BLANK', points: 2, acceptedAnswers: ['Paris'] },
        { textAnswer: 'paris' }
      );
      expect(result).toEqual({ isCorrect: true, pointsEarned: 2, feedback: undefined });
    });

    it('matches with extra whitespace trimmed', () => {
      const result = gradeAnswer(
        { type: 'FILL_IN_BLANK', points: 2, acceptedAnswers: ['Paris'] },
        { textAnswer: '  Paris  ' }
      );
      expect(result).toEqual({ isCorrect: true, pointsEarned: 2, feedback: undefined });
    });

    it('matches any of multiple accepted answers', () => {
      const result = gradeAnswer(
        { type: 'FILL_IN_BLANK', points: 2, acceptedAnswers: ['London', 'UK', 'United Kingdom'] },
        { textAnswer: 'UK' }
      );
      expect(result).toEqual({ isCorrect: true, pointsEarned: 2, feedback: undefined });
    });

    it('returns wrong for incorrect answer', () => {
      const result = gradeAnswer(
        { type: 'FILL_IN_BLANK', points: 2, acceptedAnswers: ['Paris'] },
        { textAnswer: 'Berlin' }
      );
      expect(result).toEqual({ isCorrect: false, pointsEarned: 0, feedback: undefined });
    });

    it('returns wrong for empty answer', () => {
      const result = gradeAnswer(
        { type: 'FILL_IN_BLANK', points: 2, acceptedAnswers: ['Paris'] },
        { textAnswer: '' }
      );
      expect(result).toEqual({ isCorrect: false, pointsEarned: 0, feedback: undefined });
    });
  });

  // ── SHORT_ANSWER ──
  describe('SHORT_ANSWER', () => {
    it('works same as fill in blank', () => {
      const result = gradeAnswer(
        { type: 'SHORT_ANSWER', points: 3, acceptedAnswers: ['Photosynthesis'] },
        { textAnswer: 'photosynthesis' }
      );
      expect(result).toEqual({ isCorrect: true, pointsEarned: 3, feedback: undefined });
    });
  });

  // ── NUMERIC ──
  describe('NUMERIC', () => {
    it('matches exact number', () => {
      const result = gradeAnswer(
        { type: 'NUMERIC', points: 2, correctNumber: 42 },
        { numericAnswer: 42 }
      );
      expect(result).toEqual({ isCorrect: true, pointsEarned: 2, feedback: undefined });
    });

    it('matches within tolerance', () => {
      const result = gradeAnswer(
        { type: 'NUMERIC', points: 2, correctNumber: 3.14, tolerance: 0.01 },
        { numericAnswer: 3.141 }
      );
      expect(result).toEqual({ isCorrect: true, pointsEarned: 2, feedback: undefined });
    });

    it('fails outside tolerance', () => {
      const result = gradeAnswer(
        { type: 'NUMERIC', points: 2, correctNumber: 3.14, tolerance: 0.01 },
        { numericAnswer: 3.16 }
      );
      expect(result).toEqual({ isCorrect: false, pointsEarned: 0, feedback: undefined });
    });

    it('uses zero tolerance by default', () => {
      const result = gradeAnswer(
        { type: 'NUMERIC', points: 2, correctNumber: 42 },
        { numericAnswer: 42.1 }
      );
      expect(result).toEqual({ isCorrect: false, pointsEarned: 0, feedback: undefined });
    });

    it('returns wrong for missing answer', () => {
      const result = gradeAnswer(
        { type: 'NUMERIC', points: 2, correctNumber: 42 },
        {}
      );
      expect(result).toEqual({ isCorrect: false, pointsEarned: 0, feedback: undefined });
    });
  });

  // ── MATCHING ──
  describe('MATCHING', () => {
    it('returns correct when all pairs match', () => {
      const pairs = [
        { left: 'A', right: '1' },
        { left: 'B', right: '2' },
      ];
      const result = gradeAnswer(
        { type: 'MATCHING', points: 4, matchingPairs: pairs },
        { matchingAnswer: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }] }
      );
      expect(result).toEqual({ isCorrect: true, pointsEarned: 4, feedback: undefined });
    });

    it('returns partial points for some correct pairs', () => {
      const pairs = [
        { left: 'A', right: '1' },
        { left: 'B', right: '2' },
      ];
      const result = gradeAnswer(
        { type: 'MATCHING', points: 4, matchingPairs: pairs },
        { matchingAnswer: [{ left: 'A', right: '1' }, { left: 'B', right: '3' }] }
      );
      expect(result).toEqual({ isCorrect: false, pointsEarned: 2, feedback: undefined });
    });

    it('returns wrong when no pairs match', () => {
      const pairs = [
        { left: 'A', right: '1' },
        { left: 'B', right: '2' },
      ];
      const result = gradeAnswer(
        { type: 'MATCHING', points: 4, matchingPairs: pairs },
        { matchingAnswer: [{ left: 'A', right: '2' }, { left: 'B', right: '1' }] }
      );
      expect(result).toEqual({ isCorrect: false, pointsEarned: 0, feedback: undefined });
    });

    it('returns wrong for missing answer', () => {
      const result = gradeAnswer(
        { type: 'MATCHING', points: 4, matchingPairs: [{ left: 'A', right: '1' }] },
        {}
      );
      expect(result).toEqual({ isCorrect: false, pointsEarned: 0, feedback: undefined });
    });
  });

  // ── ESSAY ──
  describe('ESSAY', () => {
    it('returns null for manual grading', () => {
      const result = gradeAnswer(
        { type: 'ESSAY', points: 10 },
        { textAnswer: 'This is a great essay...' }
      );
      expect(result).toBeNull();
    });
  });

  // ── Feedback ──
  describe('Feedback', () => {
    it('includes explanation as feedback', () => {
      const result = gradeAnswer(
        { type: 'MULTIPLE_CHOICE', points: 1, correctOptionId: 'a', explanation: 'The capital of France is Paris.' },
        { selectedOptionId: 'b' }
      );
      expect(result?.feedback).toBe('The capital of France is Paris.');
    });
  });
});

describe('gradeAttempt', () => {
  it('grades all correct answers', () => {
    const result = gradeAttempt([
      {
        question: { type: 'MULTIPLE_CHOICE', points: 2, correctOptionId: 'a' },
        answer: { selectedOptionId: 'a' },
      },
      {
        question: { type: 'TRUE_FALSE', points: 1, correctOptionId: 'true' },
        answer: { selectedOptionId: 'true' },
      },
    ]);
    expect(result).toEqual({
      score: 3,
      totalPoints: 3,
      percentage: 100,
      needsManualGrading: false,
    });
  });

  it('grades mixed with essay — flags manual grading', () => {
    const result = gradeAttempt([
      {
        question: { type: 'MULTIPLE_CHOICE', points: 2, correctOptionId: 'a' },
        answer: { selectedOptionId: 'a' },
      },
      {
        question: { type: 'ESSAY', points: 5 },
        answer: { textAnswer: 'Essay answer...' },
      },
    ]);
    expect(result).toEqual({
      score: 2,
      totalPoints: 7,
      percentage: 28.57142857142857,
      needsManualGrading: true,
    });
  });

  it('grades all wrong', () => {
    const result = gradeAttempt([
      {
        question: { type: 'MULTIPLE_CHOICE', points: 1, correctOptionId: 'a' },
        answer: { selectedOptionId: 'b' },
      },
      {
        question: { type: 'NUMERIC', points: 1, correctNumber: 42 },
        answer: { numericAnswer: 0 },
      },
    ]);
    expect(result).toEqual({
      score: 0,
      totalPoints: 2,
      percentage: 0,
      needsManualGrading: false,
    });
  });

  it('handles empty attempt', () => {
    const result = gradeAttempt([]);
    expect(result).toEqual({
      score: 0,
      totalPoints: 0,
      percentage: 0,
      needsManualGrading: false,
    });
  });
});
