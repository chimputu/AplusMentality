'use server';

// Manual grading server actions — for grading essays and open-ended answers
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

// ============================================
// Internal Helpers
// ============================================

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('Admin access required');
  }
  return user;
}

// ============================================
// Server Actions
// ============================================

// Grade a single essay answer
export async function gradeEssayAnswer(
  answerId: string,
  pointsEarned: number,
  feedback?: string
) {
  await requireAdmin();

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: {
      attempt: {
        include: {
          assessment: true,
        },
      },
      question: true,
    },
  });

  if (!answer) throw new Error('Answer not found');

  // Update the answer
  await prisma.answer.update({
    where: { id: answerId },
    data: {
      isCorrect: pointsEarned > 0,
      pointsEarned,
      feedback,
    },
  });

  // Recompute attempt score
  await recomputeAttemptScore(answer.attemptId);

  revalidatePath(`/admin/assessments/${answer.attempt.assessmentId}/grading`);
  return { success: true };
}

// Grade all remaining answers in an attempt
export async function gradeAllAnswersInAttempt(attemptId: string, grades: { answerId: string; pointsEarned: number; feedback?: string }[]) {
  await requireAdmin();

  for (const grade of grades) {
    await prisma.answer.update({
      where: { id: grade.answerId },
      data: {
        isCorrect: grade.pointsEarned > 0,
        pointsEarned: grade.pointsEarned,
        feedback: grade.feedback,
      },
    });
  }

  // Recompute attempt score
  await recomputeAttemptScore(attemptId);

  // Mark attempt as graded
  await prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: { gradedAt: new Date() },
  });

  revalidatePath('/admin/assessments');
  return { success: true };
}

// Get all attempts needing manual grading for an assessment
export async function getAttemptsNeedingGrading(assessmentId: string) {
  await requireAdmin();

  return prisma.assessmentAttempt.findMany({
    where: {
      assessmentId,
      submittedAt: { not: null },
      gradedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      answers: {
        include: {
          question: {
            select: {
              id: true,
              prompt: true,
              type: true,
              points: true,
            },
          },
        },
      },
      assessment: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });
}

// Recompute an attempt's total score
async function recomputeAttemptScore(attemptId: string) {
  const answers = await prisma.answer.findMany({
    where: { attemptId },
  });

  const score = answers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
  const totalPoints = answers.reduce((sum, a) => sum + a.pointsEarned, 0);

  await prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      score,
      percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : null,
    },
  });
}

// Get a single attempt with all answers for grading
export async function getAttemptForGrading(attemptId: string) {
  await requireAdmin();

  return prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      answers: {
        include: {
          question: {
            select: {
              id: true,
              prompt: true,
              type: true,
              points: true,
            },
          },
        },
      },
      assessment: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}
