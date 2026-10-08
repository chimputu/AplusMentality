// Zod schemas for assessment validation
import { z } from 'zod';

export const createAssessmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  type: z.enum(['QUIZ', 'TEST', 'EXAM', 'ASSIGNMENT', 'PRACTICE']),
  courseId: z.string().optional().nullable(),
  timeLimitMin: z.number().int().positive().optional(),
  availableFrom: z.coerce.date().optional().nullable(),
  availableUntil: z.coerce.date().optional().nullable(),
  maxAttempts: z.number().int().min(1).default(1),
  shuffleQs: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  showResults: z.boolean().default(true),
  showAnswers: z.boolean().default(false),
  // For native assessments: list of question IDs to include
  questionIds: z.array(z.string()).optional(),
  // For external assessments
  externalUrl: z.string().url('Must be a valid URL').optional().or(z.string().length(0)),
  externalFormId: z.string().optional(),
  externalSheetId: z.string().optional(),
  externalEmbedHtml: z.string().optional(),
  displayMode: z.enum(['EMBED', 'NEW_TAB']).default('NEW_TAB'),
  syncResponses: z.boolean().default(false),
});

export const updateAssessmentSchema = createAssessmentSchema.partial();

export const addQuestionToAssessmentSchema = z.object({
  assessmentId: z.string(),
  questionId: z.string(),
  order: z.number().int().min(0),
  pointsOverride: z.number().int().positive().optional(),
});

export const reorderAssessmentItemsSchema = z.object({
  assessmentId: z.string(),
  itemOrders: z.array(z.object({
    itemId: z.string(),
    order: z.number().int().min(0),
  })),
});
