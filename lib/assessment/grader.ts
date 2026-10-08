// Pure grading engine — no dependencies, no Prisma, no server actions
// Handles all question types: MCQ, T/F, Fill-in-blank, Numeric, Matching, Essay
export interface GradeResult {
  isCorrect: boolean;
  pointsEarned: number;
  feedback?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionWithOptions {
  type: string;
  points: number;
  explanation?: string;
  correctOptionId?: string;
  acceptedAnswers?: string[];
  correctNumber?: number;
  tolerance?: number;
  options?: QuestionOption[];
  // For matching questions: array of {left: string, right: string}
  matchingPairs?: Array<{ left: string; right: string }>;
}

export interface AnswerInput {
  selectedOptionId?: string;
  textAnswer?: string;
  numericAnswer?: number;
  matchingAnswer?: Array<{ left: string; right: string }>;
}

// Grade a single answer by question type
// Returns null for ESSAY (requires manual grading)
export function gradeAnswer(
  question: QuestionWithOptions,
  answer: Partial<AnswerInput>
): GradeResult | null {
  const points = question.points ?? 1;

  switch (question.type) {
    case 'MULTIPLE_CHOICE':
    case 'TRUE_FALSE':
      return gradeMCQ(question, answer, points);

    case 'FILL_IN_BLANK':
    case 'SHORT_ANSWER':
      return gradeText(question, answer, points);

    case 'NUMERIC':
      return gradeNumeric(question, answer, points);

    case 'MATCHING':
      return gradeMatching(question, answer, points);

    case 'ESSAY':
      // Essay requires manual grading
      return null;

    default:
      return null;
  }
}

function gradeMCQ(
  question: QuestionWithOptions,
  answer: Partial<AnswerInput>,
  points: number
): GradeResult {
  if (!answer.selectedOptionId) {
    return { isCorrect: false, pointsEarned: 0, feedback: question.explanation };
  }

  // Check via correctOptionId
  if (question.correctOptionId && answer.selectedOptionId === question.correctOptionId) {
    return { isCorrect: true, pointsEarned: points, feedback: question.explanation };
  }

  // Check via options array
  if (question.options) {
    const selected = question.options.find((o) => o.id === answer.selectedOptionId);
    if (selected?.isCorrect) {
      return { isCorrect: true, pointsEarned: points, feedback: question.explanation };
    }
  }

  return { isCorrect: false, pointsEarned: 0, feedback: question.explanation };
}

function gradeText(
  question: QuestionWithOptions,
  answer: Partial<AnswerInput>,
  points: number
): GradeResult {
  if (!answer.textAnswer || !question.acceptedAnswers?.length) {
    return { isCorrect: false, pointsEarned: 0, feedback: question.explanation };
  }

  // Normalize: trim + lowercase for comparison
  const normalized = answer.textAnswer.trim().toLowerCase();

  // Match any accepted answer
  const isCorrect = question.acceptedAnswers.some(
    (a) => a.trim().toLowerCase() === normalized
  );

  return {
    isCorrect,
    pointsEarned: isCorrect ? points : 0,
    feedback: question.explanation,
  };
}

function gradeNumeric(
  question: QuestionWithOptions,
  answer: Partial<AnswerInput>,
  points: number
): GradeResult {
  if (answer.numericAnswer === undefined || answer.numericAnswer === null) {
    return { isCorrect: false, pointsEarned: 0, feedback: question.explanation };
  }

  if (question.correctNumber === undefined) {
    return { isCorrect: false, pointsEarned: 0, feedback: question.explanation };
  }

  const tolerance = question.tolerance ?? 0;
  const diff = Math.abs(answer.numericAnswer - question.correctNumber);
  const isCorrect = diff <= tolerance;

  return {
    isCorrect,
    pointsEarned: isCorrect ? points : 0,
    feedback: question.explanation,
  };
}

function gradeMatching(
  question: QuestionWithOptions,
  answer: Partial<AnswerInput>,
  points: number
): GradeResult {
  if (!answer.matchingAnswer || !question.matchingPairs) {
    return { isCorrect: false, pointsEarned: 0, feedback: question.explanation };
  }

  const pairs = question.matchingPairs;
  const userPairs = answer.matchingAnswer;

  if (pairs.length !== userPairs.length) {
    return { isCorrect: false, pointsEarned: 0, feedback: question.explanation };
  }

  // Check all pairs match
  let correctCount = 0;
  for (const userPair of userPairs) {
    const match = pairs.find(
      (p) =>
        p.left.toLowerCase() === userPair.left.toLowerCase() &&
        p.right.toLowerCase() === userPair.right.toLowerCase()
    );
    if (match) correctCount++;
  }

  const isCorrect = correctCount === pairs.length;
  const partialPoints = (correctCount / pairs.length) * points;

  return {
    isCorrect,
    pointsEarned: isCorrect ? points : partialPoints,
    feedback: question.explanation,
  };
}

// Grade a full attempt — returns aggregate score
export function gradeAttempt(items: Array<{
  question: QuestionWithOptions;
  answer: Partial<AnswerInput>;
}>): {
  score: number;
  totalPoints: number;
  percentage: number;
  needsManualGrading: boolean;
} {
  let score = 0;
  let totalPoints = 0;
  let needsManualGrading = false;

  for (const item of items) {
    totalPoints += item.question.points ?? 1;
    const result = gradeAnswer(item.question, item.answer);

    if (result === null) {
      // Essay or unknown type — needs manual grading
      needsManualGrading = true;
    } else {
      score += result.pointsEarned;
    }
  }

  const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

  return { score, totalPoints, percentage, needsManualGrading };
}
