'use server';

// Question bank server actions — admin only
// CRUD for questions with normalized options
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { QuestionType } from '../../generated/prisma/client';

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

const questionOptionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean().default(false),
  order: z.number().int(),
});

const questionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  prompt: z.string().min(1, 'Question prompt is required'),
  explanation: z.string().optional(),
  imageUrl: z.string().optional(),
  points: z.number().int().min(1).default(1),
  difficulty: z.number().int().min(1).max(5).default(1),
  tags: z.array(z.string()).default([]),
  courseId: z.string().optional().nullable(),
  // Type-specific fields
  options: z.array(questionOptionSchema).optional(),
  acceptedAnswers: z.array(z.string()).optional(),
  correctNumber: z.number().optional(),
  tolerance: z.number().optional(),
  matchingPairs: z.array(z.object({
    left: z.string(),
    right: z.string(),
  })).optional(),
});

// ============================================
// Server Actions
// ============================================

export async function listQuestions(filters?: {
  search?: string;
  courseId?: string;
  type?: QuestionType;
  difficulty?: number;
  page?: number;
  pageSize?: number;
}) {
  await requireAdmin();

  const where: any = {};
  if (filters?.search) {
    where.prompt = { contains: filters.search, mode: 'insensitive' };
  }
  if (filters?.courseId) {
    where.courseId = filters.courseId;
  }
  if (filters?.type) {
    where.type = filters.type;
  }
  if (filters?.difficulty) {
    where.difficulty = filters.difficulty;
  }

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const [questions, total] = await prisma.$transaction([
    prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        questionOptions: { orderBy: { order: 'asc' } },
        assessmentItems: { select: { assessmentId: true, assessment: { select: { title: true } } } },
      },
    }),
    prisma.question.count({ where }),
  ]);

  return {
    questions,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getQuestion(id: string) {
  await requireAdmin();

  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      questionOptions: { orderBy: { order: 'asc' } },
      assessmentItems: {
        select: { assessmentId: true, assessment: { select: { title: true } } },
      },
    },
  });

  if (!question) throw new Error('Question not found');
  return question;
}

export async function createQuestion(rawInput: unknown) {
  const admin = await requireAdmin();

  const input = questionSchema.parse(rawInput);

  // Validate: MCQ/T/F must have options with exactly one correct
  if (input.type === 'MULTIPLE_CHOICE' || input.type === 'TRUE_FALSE') {
    if (!input.options?.length) {
      throw new Error('Multiple choice questions require options');
    }
    const correctCount = input.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new Error('Exactly one option must be marked correct');
    }
  }

  // Validate: Fill-in-blank/short answer must have accepted answers
  if (input.type === 'FILL_IN_BLANK' || input.type === 'SHORT_ANSWER') {
    if (!input.acceptedAnswers?.length) {
      throw new Error('Text questions require accepted answers');
    }
  }

  // Validate: Numeric must have correct number
  if (input.type === 'NUMERIC' && input.correctNumber === undefined) {
    throw new Error('Numeric questions require a correct number');
  }

  // Validate: Matching must have pairs
  if (input.type === 'MATCHING' && !input.matchingPairs?.length) {
    throw new Error('Matching questions require pairs');
  }

  const question = await prisma.question.create({
    data: {
      type: input.type,
      prompt: input.prompt,
      explanation: input.explanation,
      imageUrl: input.imageUrl,
      points: input.points,
      // Store type-specific data in the correct fields
      ...(input.type === 'MULTIPLE_CHOICE' || input.type === 'TRUE_FALSE'
        ? {
            correctId: input.options?.find((o) => o.isCorrect)?.id || undefined,
          }
        : {}),
      ...(input.type === 'FILL_IN_BLANK' || input.type === 'SHORT_ANSWER'
        ? { correctText: input.acceptedAnswers?.[0] || undefined }
        : {}),
      // Store additional data in JSON options field for future use
      options: {
        difficulty: input.difficulty,
        tags: input.tags,
        courseId: input.courseId,
        acceptedAnswers: input.acceptedAnswers,
        correctNumber: input.correctNumber,
        tolerance: input.tolerance,
        matchingPairs: input.matchingPairs,
      } as any,
      // Create normalized options
      ...(input.options?.length
        ? {
            questionOptions: {
              create: input.options.map((opt) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
                order: opt.order,
              })),
            },
          }
        : {}),
    },
    include: {
      questionOptions: { orderBy: { order: 'asc' } },
    },
  });

  revalidatePath('/admin/questions');
  return { success: true, questionId: question.id };
}

export async function updateQuestion(id: string, rawInput: unknown) {
  await requireAdmin();

  const input = questionSchema.parse(rawInput);

  const existing = await prisma.question.findUnique({
    where: { id },
    include: { questionOptions: true },
  });
  if (!existing) throw new Error('Question not found');

  // Validate same as create
  if (input.type === 'MULTIPLE_CHOICE' || input.type === 'TRUE_FALSE') {
    if (!input.options?.length) {
      throw new Error('Multiple choice questions require options');
    }
    const correctCount = input.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new Error('Exactly one option must be marked correct');
    }
  }

  // Delete existing options and recreate
  if (input.options?.length) {
    await prisma.questionOption.deleteMany({ where: { questionId: id } });
  }

  const question = await prisma.question.update({
    where: { id },
    data: {
      type: input.type,
      prompt: input.prompt,
      explanation: input.explanation,
      imageUrl: input.imageUrl,
      points: input.points,
      // Store additional data in JSON options field
      options: {
        difficulty: input.difficulty,
        tags: input.tags,
        courseId: input.courseId,
        acceptedAnswers: input.acceptedAnswers,
        correctNumber: input.correctNumber,
        tolerance: input.tolerance,
        matchingPairs: input.matchingPairs,
      } as any,
      ...(input.type === 'MULTIPLE_CHOICE' || input.type === 'TRUE_FALSE'
        ? {
            correctId: input.options?.find((o) => o.isCorrect)?.id || undefined,
          }
        : {}),
      ...(input.type === 'FILL_IN_BLANK' || input.type === 'SHORT_ANSWER'
        ? { correctText: input.acceptedAnswers?.[0] || undefined }
        : {}),
      ...(input.options?.length
        ? {
            questionOptions: {
              create: input.options.map((opt) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
                order: opt.order,
              })),
            },
          }
        : {}),
    },
    include: {
      questionOptions: { orderBy: { order: 'asc' } },
    },
  });

  revalidatePath('/admin/questions');
  return { success: true, questionId: question.id };
}

export async function deleteQuestion(id: string) {
  await requireAdmin();

  const question = await prisma.question.findUnique({
    where: { id },
    include: { assessmentItems: true },
  });
  if (!question) throw new Error('Question not found');

  // Check if used in assessments
  if (question.assessmentItems.length > 0) {
    throw new Error(`Question is used in ${question.assessmentItems.length} assessment(s). Remove it from assessments first.`);
  }

  await prisma.question.delete({ where: { id } });

  revalidatePath('/admin/questions');
  return { success: true };
}

export async function duplicateQuestion(id: string) {
  await requireAdmin();

  const question = await prisma.question.findUnique({
    where: { id },
    include: { questionOptions: { orderBy: { order: 'asc' } } },
  });
  if (!question) throw new Error('Question not found');

  const newQuestion = await prisma.question.create({
    data: {
      type: question.type,
      prompt: `${question.prompt} (copy)`,
      explanation: question.explanation,
      imageUrl: question.imageUrl,
      points: question.points,
      correctId: null,
      correctText: question.correctText,
      options: question.options as any,
      questionOptions: {
        create: question.questionOptions.map((opt) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
          order: opt.order,
        })),
      },
    },
    include: {
      questionOptions: { orderBy: { order: 'asc' } },
    },
  });

  revalidatePath('/admin/questions');
  return { success: true, questionId: newQuestion.id };
}
