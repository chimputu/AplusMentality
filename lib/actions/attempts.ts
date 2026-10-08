'use server';

// Attempt server actions — for students to take assessments
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { gradeAttempt } from '@/lib/assessment/grader';

// ============================================
// Internal Helpers
// ============================================

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { institution: { select: { id: true, name: true } } },
  });
  if (!user) throw new Error('User not found');
  return user;
}

// ============================================
// Schemas
// ============================================

const saveAnswerSchema = z.object({
  attemptId: z.string(),
  questionId: z.string(),
  selectedOptionId: z.string().optional(),
  textAnswer: z.string().optional(),
  numericAnswer: z.number().optional(),
  matchingAnswer: z.array(z.object({
    left: z.string(),
    right: z.string(),
  })).optional(),
});

// ============================================
// Server Actions
// ============================================

export async function getAssessmentForStudent(assessmentId: string) {
  const user = await requireUser();

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          type: true,
          prompt: true,
          imageUrl: true,
          options: true,
          points: true,
          order: true,
        },
      },
      course: { select: { code: true, title: true } },
    },
  });

  if (!assessment) throw new Error('Assessment not found');
  if (!assessment.isPublished) throw new Error('Assessment is not available');

  // Check if user already has an in-progress attempt
  const existingAttempt = await prisma.assessmentAttempt.findFirst({
    where: {
      assessmentId,
      userId: user.clerkId,
      submittedAt: null,
    },
  });

  // Check attempt count
  const completedCount = await prisma.assessmentAttempt.count({
    where: {
      assessmentId,
      userId: user.clerkId,
      submittedAt: { not: null },
    },
  });

  if (completedCount >= assessment.attemptsMax && !existingAttempt) {
    throw new Error('Maximum attempts reached');
  }

  // Sanitize questions — remove correct answers
  const sanitizedQuestions = assessment.questions.map((q) => ({
    ...q,
    options: null, // Don't send correct answers to client
  }));

  return {
    assessment: {
      ...assessment,
      questions: sanitizedQuestions,
    },
    currentAttemptId: existingAttempt?.id || null,
    attemptsUsed: completedCount,
    maxAttempts: assessment.attemptsMax,
  };
}

export async function startAttempt(assessmentId: string) {
  const user = await requireUser();

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
  });
  if (!assessment) throw new Error('Assessment not found');
  if (!assessment.isPublished) throw new Error('Assessment is not available');

  // Check attempt count
  const completedCount = await prisma.assessmentAttempt.count({
    where: {
      assessmentId,
      userId: user.clerkId,
      submittedAt: { not: null },
    },
  });

  if (completedCount >= assessment.attemptsMax) {
    throw new Error('Maximum attempts reached');
  }

  // Check for existing in-progress attempt
  const existingAttempt = await prisma.assessmentAttempt.findFirst({
    where: {
      assessmentId,
      userId: user.clerkId,
      submittedAt: null,
    },
  });

  if (existingAttempt) {
    return { attemptId: existingAttempt.id };
  }

  // Create new attempt
  const attempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId,
      userId: user.clerkId,
    },
  });

  return { attemptId: attempt.id };
}

export async function saveAnswer(rawInput: unknown) {
  const user = await requireUser();
  const input = saveAnswerSchema.parse(rawInput);

  // Verify ownership
  const attempt = await prisma.assessmentAttempt.findFirst({
    where: {
      id: input.attemptId,
      userId: user.clerkId,
    },
  });
  if (!attempt) throw new Error('Attempt not found');
  if (attempt.submittedAt) throw new Error('Attempt already submitted');

  // Store answer in the attempt's JSON answers field
  const currentAnswers = (attempt.answers as Record<string, any>) || {};
  currentAnswers[input.questionId] = {
    selectedOptionId: input.selectedOptionId,
    textAnswer: input.textAnswer,
    numericAnswer: input.numericAnswer,
    matchingAnswer: input.matchingAnswer,
    answeredAt: new Date().toISOString(),
  };

  await prisma.assessmentAttempt.update({
    where: { id: input.attemptId },
    data: { answers: currentAnswers },
  });

  return { success: true, savedAt: new Date().toISOString() };
}

export async function submitAttempt(attemptId: string) {
  const user = await requireUser();

  // Verify ownership
  const attempt = await prisma.assessmentAttempt.findFirst({
    where: {
      id: attemptId,
      userId: user.clerkId,
    },
    include: {
      assessment: {
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: {
              questionOptions: { orderBy: { order: 'asc' } },
            },
          },
        },
      },
    },
  });
  if (!attempt) throw new Error('Attempt not found');
  if (attempt.submittedAt) throw new Error('Attempt already submitted');

  const answers = (attempt.answers as Record<string, any>) || {};
  const timeSpent = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

  // Grade the attempt using the grading engine
  const items = attempt.assessment.questions.map((q: any) => ({
    question: {
      type: q.type,
      points: q.points,
      explanation: q.explanation,
      correctOptionId: q.correctId,
      acceptedAnswers: q.correctText ? [q.correctText] : undefined,
      options: q.questionOptions,
    },
    answer: answers[q.id] || {},
  }));

  const result = gradeAttempt(items);

  // Update attempt with results
  const updatedAttempt = await prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      submittedAt: new Date(),
      timeSpent,
      score: result.score,
      totalPoints: result.totalPoints,
      percentage: result.percentage,
      passed: result.percentage >= (attempt.assessment.passingScore || 50),
    },
  });

  revalidatePath('/assessments');
  return {
    attemptId,
    score: result.score,
    totalPoints: result.totalPoints,
    percentage: result.percentage,
    needsManualGrading: result.needsManualGrading,
    passed: updatedAttempt.passed,
  };
}

export async function getAttemptResult(attemptId: string) {
  const user = await requireUser();

  const attempt = await prisma.assessmentAttempt.findFirst({
    where: {
      id: attemptId,
      userId: user.clerkId,
    },
    include: {
      assessment: {
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: {
              questionOptions: { orderBy: { order: 'asc' } },
            },
          },
        },
      },
    },
  });
  if (!attempt) throw new Error('Attempt not found');
  if (!attempt.submittedAt) throw new Error('Attempt not yet submitted');

  return {
    attempt: {
      id: attempt.id,
      score: attempt.score,
      totalPoints: attempt.totalPoints,
      percentage: attempt.percentage,
      passed: attempt.passed,
      timeSpent: attempt.timeSpent,
      submittedAt: attempt.submittedAt,
    },
    assessment: attempt.assessment,
    answers: attempt.answers as Record<string, any> || {},
    showAnswers: attempt.assessment.showAnswersAfter === 'IMMEDIATELY',
  };
}

export async function getStudentAssessments() {
  const user = await requireUser();

  const assessments = await prisma.assessment.findMany({
    where: {
      isPublished: true,
    },
    include: {
      questions: { select: { id: true, points: true } },
      attempts: {
        where: { userId: user.clerkId },
        select: { id: true, score: true, percentage: true, submittedAt: true, passed: true },
        orderBy: { submittedAt: 'desc' },
      },
      course: { select: { code: true, title: true } },
    },
  });

  return assessments.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    type: a.type,
    mode: a.mode,
    timeLimit: a.timeLimit,
    attemptsMax: a.attemptsMax,
    attemptsUsed: a.attempts.length,
    lastAttempt: a.attempts[0] || null,
    course: a.course,
    totalQuestions: a.questions.length,
    totalPoints: a.questions.reduce((sum, q) => sum + q.points, 0),
  }));
}
