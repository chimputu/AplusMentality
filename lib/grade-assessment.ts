// lib/grade-assessment.ts
// Pure function to grade a native assessment attempt

interface Question {
  id: string;
  type: string;
  correctId?: string | null;
  correctText?: string | null;
  points: number;
}

interface Answer {
  questionId: string;
  selectedId?: string | null;
  text?: string | null;
  fileUrl?: string | null;
}

interface GradeInput {
  questions: Question[];
  answers: Answer[];
  passingScore: number;
}

interface GradeBreakdown {
  questionId: string;
  points: number;
  earned: number;
  needsManualGrading: boolean;
}

interface GradeResult {
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  needsManualGrading: boolean;
  breakdown: GradeBreakdown[];
}

export function gradeAssessment({ questions, answers, passingScore }: GradeInput): GradeResult {
  let score = 0;
  let totalPoints = 0;
  let needsManualGrading = false;
  const breakdown: GradeBreakdown[] = [];

  for (const question of questions) {
    const answer = answers.find(a => a.questionId === question.id);
    totalPoints += question.points;
    let earned = 0;
    let questionNeedsManual = false;

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
      case 'IMAGE_CHOICE':
        if (answer?.selectedId === question.correctId) {
          earned = question.points;
        }
        break;

      case 'TRUE_FALSE':
        if (answer?.selectedId === question.correctId) {
          earned = question.points;
        }
        break;

      case 'SHORT_ANSWER':
        if (answer?.text && question.correctText) {
          const normalizedAnswer = answer.text.trim().toLowerCase();
          const normalizedCorrect = question.correctText.trim().toLowerCase();
          if (normalizedAnswer === normalizedCorrect) {
            earned = question.points;
          }
        }
        break;

      case 'ESSAY':
      case 'FILE_UPLOAD':
        // These require manual grading
        questionNeedsManual = true;
        needsManualGrading = true;
        break;

      default:
        questionNeedsManual = true;
        needsManualGrading = true;
    }

    score += earned;
    breakdown.push({
      questionId: question.id,
      points: question.points,
      earned,
      needsManualGrading: questionNeedsManual,
    });
  }

  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const passed = percentage >= passingScore;

  return {
    score,
    totalPoints,
    percentage,
    passed,
    needsManualGrading,
    breakdown,
  };
}
