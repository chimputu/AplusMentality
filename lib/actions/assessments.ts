'use server';

// Assessment server actions — admin only
// CRUD for assessments with question management
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { AssessmentType, AssessmentMode, LiveStatus, ResultReveal } from '../../generated/prisma/client';

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
// Schemas
// ============================================

const assessmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  type: z.nativeEnum(AssessmentType),
  courseId: z.string(),
  mode: z.nativeEnum(AssessmentMode).default('NATIVE'),
  timeLimit: z.number().int().positive().optional(),
  openAt: z.coerce.date().optional().nullable(),
  closeAt: z.coerce.date().optional().nullable(),
  attemptsMax: z.number().int().min(1).default(1),
  shuffleQs: z.boolean().default(false),
  showAnswersAfter: z.nativeEnum(ResultReveal).default('IMMEDIATELY'),
  isPublished: z.boolean().default(false),
  // External form fields
  embedUrl: z.string().optional().nullable(),
  formUrl: z.string().optional().nullable(),
  // Question IDs for native assessments
  questionIds: z.array(z.string()).optional(),
});

// ============================================
// Server Actions
// ============================================

export async function listAssessments(filters?: {
  search?: string;
  type?: string;
  published?: boolean;
  courseId?: string;
}) {
  await requireAdmin();

  const where: any = {};
  if (filters?.search) {
    where.title = { contains: filters.search, mode: 'insensitive' };
  }
  if (filters?.type) {
    where.type = filters.type;
  }
  if (filters?.published !== undefined) {
    where.isPublished = filters.published;
  }
  if (filters?.courseId) {
    where.courseId = filters.courseId;
  }

  return prisma.assessment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      questions: { select: { id: true, type: true, points: true }, take: 10 },
      attempts: { select: { id: true } },
      course: { select: { code: true, title: true } },
    },
  });
}

export async function getAssessment(id: string) {
  await requireAdmin();

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: {
          questionOptions: { orderBy: { order: 'asc' } },
        },
      },
      attempts: {
        select: {
          id: true,
          userId: true,
          user: { select: { firstName: true, email: true } },
          score: true,
          totalPoints: true,
          percentage: true,
          submittedAt: true,
        },
      },
      course: { select: { code: true, title: true } },
    },
  });

  if (!assessment) throw new Error('Assessment not found');
  return assessment;
}

export async function createAssessment(rawInput: unknown) {
  const admin = await requireAdmin();

  const input = assessmentSchema.parse(rawInput);

  const assessment = await prisma.assessment.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      courseId: input.courseId,
      mode: input.mode,
      liveStatus: input.isPublished ? 'OPEN' : 'DRAFT',
      timeLimit: input.timeLimit,
      openAt: input.openAt,
      closeAt: input.closeAt,
      attemptsMax: input.attemptsMax,
      shuffleQs: input.shuffleQs,
      showAnswersAfter: input.showAnswersAfter,
      isPublished: input.isPublished,
      embedUrl: input.embedUrl,
      formUrl: input.formUrl,
      createdBy: admin.clerkId,
    },
  });

  // For native assessments, copy questions from the bank
  if (input.questionIds?.length && input.mode === 'NATIVE') {
    const bankQuestions = await prisma.question.findMany({
      where: { id: { in: input.questionIds } },
    });
    await prisma.question.createMany({
      data: bankQuestions.map((bankQ, i) => ({
        assessmentId: assessment.id,
        order: (input.questionIds || []).indexOf(bankQ.id),
        type: bankQ.type,
        prompt: bankQ.prompt,
        imageUrl: bankQ.imageUrl,
        options: bankQ.options || undefined,
        correctId: bankQ.correctId,
        correctText: bankQ.correctText,
        points: bankQ.points,
        explanation: bankQ.explanation,
      })),
    });
  }

  revalidatePath('/admin/assessments');
  return { success: true, assessmentId: assessment.id };
}

export async function updateAssessment(id: string, rawInput: unknown) {
  await requireAdmin();

  const input = assessmentSchema.partial().parse(rawInput);

  const existing = await prisma.assessment.findUnique({ where: { id } });
  if (!existing) throw new Error('Assessment not found');

  await prisma.assessment.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      courseId: input.courseId,
      mode: input.mode,
      timeLimit: input.timeLimit,
      openAt: input.openAt,
      closeAt: input.closeAt,
      attemptsMax: input.attemptsMax,
      shuffleQs: input.shuffleQs,
      showAnswersAfter: input.showAnswersAfter,
      isPublished: input.isPublished,
      embedUrl: input.embedUrl,
      formUrl: input.formUrl,
    },
  });

  revalidatePath('/admin/assessments');
  return { success: true };
}

export async function deleteAssessment(id: string) {
  await requireAdmin();

  await prisma.assessment.delete({ where: { id } });

  revalidatePath('/admin/assessments');
  return { success: true };
}

export async function publishAssessment(id: string) {
  await requireAdmin();

  await prisma.assessment.update({
    where: { id },
    data: { isPublished: true, liveStatus: 'OPEN' },
  });

  revalidatePath('/admin/assessments');
  return { success: true };
}

export async function unpublishAssessment(id: string) {
  await requireAdmin();

  await prisma.assessment.update({
    where: { id },
    data: { isPublished: false, liveStatus: 'DRAFT' },
  });

  revalidatePath('/admin/assessments');
  return { success: true };
}

export async function addQuestionToAssessment(assessmentId: string, questionId: string) {
  await requireAdmin();

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  if (!assessment) throw new Error('Assessment not found');

  const maxOrder = assessment.questions.reduce((max, q) => Math.max(max, q.order), -1);

  // Copy from bank question
  const bankQuestion = await prisma.question.findUnique({
    where: { id: questionId },
  });
  if (!bankQuestion) throw new Error('Question not found');

  await prisma.question.create({
    data: {
      assessmentId,
      order: maxOrder + 1,
      type: bankQuestion.type,
      prompt: bankQuestion.prompt,
      imageUrl: bankQuestion.imageUrl,
      options: bankQuestion.options || undefined,
      correctId: bankQuestion.correctId,
      correctText: bankQuestion.correctText,
      points: bankQuestion.points,
      explanation: bankQuestion.explanation,
    },
  });

  revalidatePath('/admin/assessments');
  return { success: true };
}

export async function removeQuestionFromAssessment(assessmentId: string, questionId: string) {
  await requireAdmin();

  await prisma.question.deleteMany({
    where: {
      assessmentId,
      id: questionId,
    },
  });

  revalidatePath('/admin/assessments');
  return { success: true };
}

export async function reorderAssessmentQuestions(
  assessmentId: string,
  orderedQuestionIds: string[]
) {
  await requireAdmin();

  for (let i = 0; i < orderedQuestionIds.length; i++) {
    await prisma.question.updateMany({
      where: {
        id: orderedQuestionIds[i],
        assessmentId,
      },
      data: { order: i },
    });
  }

  revalidatePath('/admin/assessments');
  return { success: true };
}
