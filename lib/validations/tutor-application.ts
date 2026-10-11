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

// ─── Personal Details ───
export const personalDetailsSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

// ─── Professional Details ───
export const professionalDetailsSchema = z.object({
  experienceYears: z.coerce.number().int().min(0, 'Cannot be negative').max(60, 'Must be 60 or less'),
  institutionId: z.string().optional().nullable(),
});

// ─── Qualifications ───
export const qualificationItemSchema = z.object({
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution is required'),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
});

export const qualificationsSchema = z
  .array(qualificationItemSchema)
  .optional()
  .or(z.literal(null));

// ─── Documents ───
export const documentsSchema = z.object({
  cvUrl: z.string().url('Must be a valid URL').optional().or(z.string().length(0)).optional(),
});

// ─── Statement ───
export const statementSchema = z.object({
  teachingPhilosophy: z
    .string()
    .min(50, 'Please write at least 50 characters about your teaching philosophy')
    .max(5000, 'Maximum 5000 characters'),
});

// ─── Profile Photo ───
export const profilePhotoSchema = z.object({
  profilePhotoUrl: z.string().url('Profile photo is required'),
  profilePhotoPublicId: z.string().min(1),
});

// ─── NRC (Green Card) ───
export const nrcSchema = z.object({
  nrcFrontUrl: z.string().url('NRC front photo is required'),
  nrcFrontPublicId: z.string().min(1),
  nrcBackUrl: z.string().url('NRC back photo is required'),
  nrcBackPublicId: z.string().min(1),
  nrcNumber: z.string()
    .regex(/^\d{6}\/\d{2}\/\d{1}$/, 'Format: 123456/78/9')
    .optional()
    .or(z.literal('')),
});

// ─── Grade 12 Results ───
export const grade12Schema = z.object({
  grade12School: z.string().min(3).max(200),
  grade12Year: z.number().int().min(1990).max(new Date().getFullYear()),
  grade12ResultsUrl: z.string().url().optional().or(z.string().length(0)),
  grade12Summary: z.string().min(3).max(500),
});

// ─── Current Academic Records ───
export const currentAcademicSchema = z.object({
  currentInstitution: z.string().min(3).max(200).optional().or(z.string().length(0)),
  currentProgramme: z.string().min(3).max(200).optional().or(z.string().length(0)),
  currentYear: z.number().int().min(1).max(10).optional(),
  academicRecordsUrl: z.string().url().optional().or(z.string().length(0)),
  academicSummary: z.string().min(3).max(500).optional().or(z.string().length(0)),
});

// ─── References ───
export const referenceSchema = z.object({
  fullName: z.string().min(3).max(200),
  relationship: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20).optional(),
  institution: z.string().max(200).optional(),
});

export const referencesSchema = z.object({
  references: z.array(referenceSchema)
    .min(2, 'At least 2 references required')
    .max(5, 'Maximum 5 references'),
});

// ─── Course Offerings ───
export const offeringSchema = z.object({
  courseId: z.string().optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(20).max(2000),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  priceZMW: z.number().int().min(0).max(100000),
  durationMinutes: z.number().int().min(15).max(300),
  maxStudentsPerSession: z.number().int().min(1).max(100),
  modes: z.array(z.enum(['ONLINE', 'HYBRID', 'PHYSICAL']))
    .min(1, 'Select at least one mode'),
  schedule: z.any().optional(),
  prerequisites: z.string().max(1000).optional(),
  learningOutcomes: z.array(z.string().min(3).max(200)).max(10),
});

export const offeringsSchema = z.object({
  offerings: z.array(offeringSchema)
    .min(1, 'Add at least one course you teach')
    .max(20, 'Maximum 20 courses'),
});

// ─── Teaching Modes ───
export const teachingModesSchema = z.object({
  teachingModes: z.array(z.enum(['ONLINE', 'HYBRID', 'PHYSICAL']))
    .min(1, 'Select at least one teaching mode'),
  physicalLocation: z.string().max(200).optional(),
});

// ─── Pricing ───
export const pricingSchema = z.object({
  hourlyRateZMW: z.number().int().min(0).max(50000),
  minimumBookingHours: z.number().int().min(0).max(8),
});

// ─── Schedule ───
export const scheduleSchema = z.object({
  teachingSchedule: z.record(
    z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
    z.array(z.string())
  ).optional(),
});

// ─── Combined Full Schema ───
export const fullApplicationSchema = personalDetailsSchema
  .merge(professionalDetailsSchema)
  .merge(profilePhotoSchema)
  .merge(nrcSchema)
  .merge(grade12Schema)
  .merge(currentAcademicSchema)
  .merge(documentsSchema)
  .merge(referencesSchema)
  .merge(offeringsSchema)
  .merge(teachingModesSchema)
  .merge(pricingSchema)
  .merge(scheduleSchema)
  .merge(statementSchema)
  .extend({
    qualifications: qualificationsSchema,
    isReadyToTeach: z.boolean().refine((v) => v === true,
      'You must confirm you are ready to teach'),
  });

// ─── Admin Schemas ───
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
