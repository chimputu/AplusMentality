// Zod schemas for tutor application validation
import { z } from 'zod';

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5 MB

export const personalDetailsSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

export const professionalDetailsSchema = z.object({
  experienceYears: z.coerce.number().int().min(0, 'Cannot be negative').max(60, 'Must be 60 or less'),
  institutionId: z.string().optional().nullable(),
});

export const qualificationItemSchema = z.object({
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution is required'),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
});

export const qualificationsSchema = z
  .array(qualificationItemSchema)
  .optional()
  .or(z.literal(null));

export const documentsSchema = z.object({
  cvUrl: z.string().url('Must be a valid URL').optional().or(z.string().length(0)).optional(),
});

export const statementSchema = z.object({
  teachingPhilosophy: z
    .string()
    .min(50, 'Please write at least 50 characters about your teaching philosophy')
    .max(5000, 'Maximum 5000 characters'),
});

export const fullApplicationSchema = personalDetailsSchema
  .merge(professionalDetailsSchema)
  .merge(documentsSchema)
  .merge(statementSchema)
  .extend({
    qualifications: qualificationsSchema,
  });

export const approveApplicationSchema = z.object({
  applicationId: z.string(),
  adminNotes: z.string().optional(),
});

export const rejectApplicationSchema = z.object({
  applicationId: z.string(),
  rejectionReason: z.string().min(10, 'Please provide a detailed rejection reason'),
  adminNotes: z.string().optional(),
});

export const requestInfoSchema = z.object({
  applicationId: z.string(),
  adminNotes: z.string().min(10, 'Please specify what additional information is needed'),
});

export const listApplicationsSchema = z.object({
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN']).optional(),
  institutionId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const documentUploadSchema = z.object({
  fileType: z.enum(['cv', 'certificate']),
  mimeType: z.string().refine(
    (m) => ALLOWED_DOCUMENT_TYPES.includes(m),
    'File type not allowed. Allowed: PDF, JPG, PNG, WebP'
  ),
  fileSize: z.number().max(MAX_DOCUMENT_SIZE, 'File size must be under 5 MB'),
});
