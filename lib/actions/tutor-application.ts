'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/retry';
import {
  fullApplicationSchema,
  approveApplicationSchema,
  rejectApplicationSchema,
  requestInfoSchema,
  listApplicationsSchema,
} from '@/lib/validations/tutor-application';
import {
  sendTutorApplicationEmail,
  createSubmittedEmail,
  createApprovedEmail,
  createRejectedEmail,
} from '@/lib/email';
import { addUserToClerkOrg } from '@/lib/clerk-org';

// ============================================
// Internal Helpers
// ============================================

async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error('User not found');
  return user;
}

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
// Student: Submit Tutor Application
// ============================================

export async function submitTutorApplication(rawInput: unknown) {
  try {
    console.log('[submitTutorApplication] Starting submission...');

    const user = await requireAuth();
    console.log('[submitTutorApplication] Authenticated user:', user.id);

    let input: any;
    try {
      input = fullApplicationSchema.parse(rawInput);
    } catch (validationErr: any) {
      console.error('[submitTutorApplication] Validation failed:', {
        errors: validationErr.errors?.map((e: any) => e.message),
        message: validationErr.message,
      });
      const firstError = validationErr.errors?.[0]?.message ?? validationErr.message ?? 'Invalid application data';
      throw new Error(firstError);
    }
    console.log('[submitTutorApplication] Validation passed');

    // Check if user already has an active application
    const existing = await withRetry(
      async () => prisma.tutorApplication.findUnique({
        where: { userId: user.id },
        include: { references: true, offerings: true },
      }),
      { attempts: 3, delayMs: 500 }
    );
    console.log('[submitTutorApplication] Existing application check:', existing ? `found (${existing.status})` : 'none');

    if (existing && existing.status !== 'REJECTED' && existing.status !== 'WITHDRAWN') {
      throw new Error('You already have a pending or approved application');
    }

    let application;

    if (existing) {
      console.log('[submitTutorApplication] Updating existing application:', existing.id);
      await withRetry(
        async () => prisma.tutorReference.deleteMany({ where: { tutorApplicationId: existing.id } }),
        { attempts: 3, delayMs: 500 }
      );
      await withRetry(
        async () => prisma.tutorOffering.deleteMany({ where: { tutorApplicationId: existing.id } }),
        { attempts: 3, delayMs: 500 }
      );

      application = await withRetry(async () => {
        return prisma.tutorApplication.update({
          where: { id: existing.id },
          data: {
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            qualifications: (input.qualifications ?? null) as any,
            experienceYears: input.experienceYears,
            cvUrl: input.cvUrl,
            teachingPhilosophy: input.teachingPhilosophy,
            institutionId: input.institutionId,
            status: 'PENDING',
            adminNotes: null,
            rejectionReason: null,
            reviewedAt: null,
            decidedAt: null,
            profilePhotoUrl: input.profilePhotoUrl,
            profilePhotoPublicId: input.profilePhotoPublicId,
            nrcFrontUrl: input.nrcFrontUrl,
            nrcFrontPublicId: input.nrcFrontPublicId,
            nrcBackUrl: input.nrcBackUrl,
            nrcBackPublicId: input.nrcBackPublicId,
            nrcNumber: input.nrcNumber || null,
            grade12School: input.grade12School,
            grade12Year: input.grade12Year,
            grade12ResultsUrl: input.grade12ResultsUrl,
            grade12Summary: input.grade12Summary,
            currentInstitution: input.currentInstitution,
            currentProgramme: input.currentProgramme,
            currentYear: input.currentYear,
            academicRecordsUrl: input.academicRecordsUrl,
            academicSummary: input.academicSummary,
            teachingModes: input.teachingModes,
            physicalLocation: input.physicalLocation,
            teachingSchedule: (input.teachingSchedule ?? null) as any,
            hourlyRateZMW: input.hourlyRateZMW,
            minimumBookingHours: input.minimumBookingHours,
            isReadyToTeach: input.isReadyToTeach,
            references: {
              create: input.references.map((ref: any) => ({
                fullName: ref.fullName,
                relationship: ref.relationship,
                email: ref.email,
                phone: ref.phone,
                institution: ref.institution,
              })),
            },
            offerings: {
              create: input.offerings.map((off: any) => ({
                courseId: off.courseId || null,
                title: off.title,
                description: off.description,
                level: off.level,
                priceZMW: off.priceZMW,
                durationMinutes: off.durationMinutes,
                maxStudentsPerSession: off.maxStudentsPerSession,
                modes: off.modes,
                schedule: (off.schedule ?? null) as any,
                prerequisites: off.prerequisites,
                learningOutcomes: off.learningOutcomes,
              })),
            },
          },
          include: { references: true, offerings: true },
        });
      }, { attempts: 3, delayMs: 500 });
    } else {
      console.log('[submitTutorApplication] Creating new application for user:', user.id);
      application = await withRetry(async () => {
        return prisma.tutorApplication.create({
          data: {
            userId: user.id,
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            qualifications: (input.qualifications ?? null) as any,
            experienceYears: input.experienceYears,
            cvUrl: input.cvUrl,
            teachingPhilosophy: input.teachingPhilosophy,
            institutionId: input.institutionId,
            status: 'PENDING',
            profilePhotoUrl: input.profilePhotoUrl,
            profilePhotoPublicId: input.profilePhotoPublicId,
            nrcFrontUrl: input.nrcFrontUrl,
            nrcFrontPublicId: input.nrcFrontPublicId,
            nrcBackUrl: input.nrcBackUrl,
            nrcBackPublicId: input.nrcBackPublicId,
            nrcNumber: input.nrcNumber || null,
            grade12School: input.grade12School,
            grade12Year: input.grade12Year,
            grade12ResultsUrl: input.grade12ResultsUrl,
            grade12Summary: input.grade12Summary,
            currentInstitution: input.currentInstitution,
            currentProgramme: input.currentProgramme,
            currentYear: input.currentYear,
            academicRecordsUrl: input.academicRecordsUrl,
            academicSummary: input.academicSummary,
            teachingModes: input.teachingModes,
            physicalLocation: input.physicalLocation,
            teachingSchedule: (input.teachingSchedule ?? null) as any,
            hourlyRateZMW: input.hourlyRateZMW,
            minimumBookingHours: input.minimumBookingHours,
            isReadyToTeach: input.isReadyToTeach,
            references: {
              create: input.references.map((ref: any) => ({
                fullName: ref.fullName,
                relationship: ref.relationship,
                email: ref.email,
                phone: ref.phone,
                institution: ref.institution,
              })),
            },
            offerings: {
              create: input.offerings.map((off: any) => ({
                courseId: off.courseId || null,
                title: off.title,
                description: off.description,
                level: off.level,
                priceZMW: off.priceZMW,
                durationMinutes: off.durationMinutes,
                maxStudentsPerSession: off.maxStudentsPerSession,
                modes: off.modes,
                schedule: (off.schedule ?? null) as any,
                prerequisites: off.prerequisites,
                learningOutcomes: off.learningOutcomes,
              })),
            },
          },
          include: { references: true, offerings: true },
        });
      }, { attempts: 3, delayMs: 500 });
    }

    console.log('[submitTutorApplication] Application saved:', application.id);

    // Send email notification to admins
    const admins = await withRetry(
      async () => prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true },
      }),
      { attempts: 3, delayMs: 500 }
    );
    console.log('[submitTutorApplication] Found admins to notify:', admins.length);
    for (const admin of admins) {
      const email = createSubmittedEmail(admin.email, input.fullName, input.email);
      await sendTutorApplicationEmail(email).catch((e) =>
        console.error('[submitTutorApplication] Failed to send email to', admin.email, e?.message)
      );
    }

    revalidatePath('/apply-as-tutor');
    console.log('[submitTutorApplication] Submission completed successfully');
    return { success: true, applicationId: application.id };
  } catch (err: any) {
    // Log full error details for Vercel diagnostics
    console.error('[submitTutorApplication] Fatal error:', {
      message: err?.message,
      code: err?.code,
      meta: err?.meta,
      type: err?.constructor?.name,
      stack: err?.stack?.split('\n').slice(0, 5).join('\n'),
    });

    // Handle database errors with user-friendly messages
    if (err.code === 'P2021' || err.code === 'P2025') {
      throw new Error('Application system is currently being set up. Please try again later.');
    }
    if (err.code === 'P1001' || err.code === 'P1002' || err.code === 'P1008') {
      throw new Error('Database connection issue. Please try again in a moment.');
    }
    // Handle constraint violations (e.g. field too long, not null violation)
    if (err.code === 'P2002') {
      console.error('[submitTutorApplication] Unique constraint violation:', err?.meta);
      throw new Error('A unique constraint was violated. Please check your data and try again.');
    }
    if (err.code === 'P2000') {
      console.error('[submitTutorApplication] Constraint violation:', err?.meta);
      throw new Error('Data constraint violation. Please check your input and try again.');
    }
    // Re-throw other errors (validation, business logic) as-is
    throw err;
  }
}

// ============================================
// Student: Get My Application
// ============================================

export async function getMyTutorApplication() {
  const user = await requireAuth();

  const application = await prisma.tutorApplication.findUnique({
    where: { userId: user.id },
    include: {
      institution: { select: { id: true, name: true, shortName: true } },
    },
  });

  if (!application) return null;

  return {
    id: application.id,
    fullName: application.fullName,
    email: application.email,
    phone: application.phone,
    qualifications: application.qualifications,
    experienceYears: application.experienceYears,
    cvUrl: application.cvUrl,
    teachingPhilosophy: application.teachingPhilosophy,
    status: application.status,
    rejectionReason: application.rejectionReason,
    adminNotes: application.adminNotes,
    submittedAt: application.submittedAt,
    reviewedAt: application.reviewedAt,
    decidedAt: application.decidedAt,
    institution: application.institution,
  };
}

// ============================================
// Student: Withdraw Application
// ============================================

export async function withdrawTutorApplication() {
  const user = await requireAuth();

  const application = await prisma.tutorApplication.findUnique({
    where: { userId: user.id },
  });

  if (!application) throw new Error('No application found');
  if (application.status === 'APPROVED') throw new Error('Cannot withdraw an approved application');
  if (application.status === 'WITHDRAWN') throw new Error('Application already withdrawn');

  await prisma.tutorApplication.update({
    where: { id: application.id },
    data: { status: 'WITHDRAWN' },
  });

  revalidatePath('/apply-as-tutor');
  return { success: true };
}

// ============================================
// Admin: List Applications
// ============================================

export async function listTutorApplications(rawInput?: unknown) {
  await requireAdmin();

  const input = listApplicationsSchema.parse(rawInput || {});
  const skip = (input.page - 1) * input.limit;

  const where: any = {};
  if (input.status) where.status = input.status;
  if (input.institutionId) where.institutionId = input.institutionId;

  const [total, applications] = await Promise.all([
    prisma.tutorApplication.count({ where }),
    prisma.tutorApplication.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: { submittedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
            role: true,
          },
        },
        institution: { select: { id: true, name: true, shortName: true } },
      },
    }),
  ]);

  const items = applications.map((a) => ({
    id: a.id,
    userId: a.userId,
    fullName: a.fullName,
    email: a.email,
    phone: a.phone,
    experienceYears: a.experienceYears,
    cvUrl: a.cvUrl,
    status: a.status,
    adminNotes: a.adminNotes,
    rejectionReason: a.rejectionReason,
    submittedAt: a.submittedAt,
    reviewedAt: a.reviewedAt,
    decidedAt: a.decidedAt,
    user: a.user,
    institution: a.institution,
  }));

  return {
    applications: items,
    total,
    page: input.page,
    limit: input.limit,
    totalPages: Math.ceil(total / input.limit),
  };
}

// ============================================
// Admin: Get Single Application
// ============================================

export async function getTutorApplication(applicationId: string) {
  await requireAdmin();

  const application = await prisma.tutorApplication.findUnique({
    where: { id: applicationId },
    include: {
      user: {
        select: {
          id: true,
          clerkId: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
          role: true,
          institutionId: true,
        },
      },
      institution: { select: { id: true, name: true, shortName: true } },
    },
  });

  if (!application) throw new Error('Application not found');

  return {
    id: application.id,
    userId: application.userId,
    fullName: application.fullName,
    email: application.email,
    phone: application.phone,
    qualifications: application.qualifications,
    experienceYears: application.experienceYears,
    cvUrl: application.cvUrl,
    teachingPhilosophy: application.teachingPhilosophy,
    status: application.status,
    adminNotes: application.adminNotes,
    rejectionReason: application.rejectionReason,
    submittedAt: application.submittedAt,
    reviewedAt: application.reviewedAt,
    decidedAt: application.decidedAt,
    user: application.user,
    institution: application.institution,
  };
}

// ============================================
// Admin: Approve Application
// ============================================

export async function approveTutorApplication(rawInput: unknown) {
  const admin = await requireAdmin();

  const input = approveApplicationSchema.parse(rawInput);

  const application = await prisma.tutorApplication.findUnique({
    where: { id: input.applicationId },
  });

  if (!application) throw new Error('Application not found');
  if (application.status !== 'PENDING' && application.status !== 'UNDER_REVIEW') {
    throw new Error('Only pending or under-review applications can be approved');
  }

  // Fetch application with user, institution, and offerings for email, Clerk org, and Tutor creation
  const fullApplication = await prisma.tutorApplication.findUnique({
    where: { id: input.applicationId },
    include: {
      user: { select: { id: true, clerkId: true, email: true } },
      institution: { select: { id: true, name: true, shortName: true, clerkOrgId: true } },
      offerings: true,
    },
  });

  if (!fullApplication) throw new Error('Application not found');

  await prisma.$transaction(async (tx) => {
    // Update application status
    await tx.tutorApplication.update({
      where: { id: input.applicationId },
      data: {
        status: 'APPROVED',
        adminNotes: input.adminNotes,
        reviewedAt: new Date(),
        decidedAt: new Date(),
      },
    });

    // Mark user as verified tutor, update role to TUTOR, and copy profile photo to their public profile
    await tx.user.update({
      where: { id: application.userId },
      data: {
        role: 'TUTOR',
        isVerifiedTutor: true,
        imageUrl: application.profilePhotoUrl ?? undefined,
      },
    });

    // Auto-create Tutor record if one doesn't already exist for this user
    const existingTutor = await tx.tutor.findUnique({
      where: { userId: application.userId },
    });

    if (!existingTutor) {
      // Derive mode from the first offering's modes, defaulting to 'online'
      const firstOffering = fullApplication.offerings[0];
      const mode = (firstOffering?.modes?.[0] ?? 'online').toLowerCase();

      const createdTutor = await tx.tutor.create({
        data: {
          userId: application.userId,
          fullName: application.fullName,
          email: application.email,
          phone: application.phone,
          bio: application.teachingPhilosophy,
          avatarUrl: application.profilePhotoUrl,
          yearsExperience: application.experienceYears,
          mode,
          isVerified: true,
          isActive: true,
        },
      });

      // Create TutorSpecialty records from the application's course offerings
      const validOfferings = fullApplication.offerings.filter(
        (offering) => offering.courseId != null
      );

      if (validOfferings.length > 0) {
        const specialtyData = validOfferings.map((offering) => ({
          tutorId: createdTutor.id,
          courseId: offering.courseId!,
          personalRate: offering.priceZMW ? parseFloat(String(offering.priceZMW)) : undefined,
          groupEnabled: offering.maxStudentsPerSession > 1,
          groupRate:
            offering.maxStudentsPerSession > 1 && offering.priceZMW
              ? parseFloat(String(offering.priceZMW))
              : undefined,
          groupMaxSize: offering.maxStudentsPerSession > 1 ? offering.maxStudentsPerSession : undefined,
        }));

        await tx.tutorSpecialty.createMany({
          data: specialtyData,
          skipDuplicates: true,
        });
      }
    }
  });

  // Send approval email to the applicant
  const instName = fullApplication.institution?.shortName || fullApplication.institution?.name;
  const approvedEmail = createApprovedEmail(
    fullApplication.user.email,
    fullApplication.fullName,
    instName
  );
  await sendTutorApplicationEmail(approvedEmail).catch(console.error);

  // Add user to Clerk organization if institution has one
  if (fullApplication.institution?.clerkOrgId && fullApplication.user.clerkId) {
    await addUserToClerkOrg(
      fullApplication.user.clerkId,
      fullApplication.institution.clerkOrgId,
      'org:member'
    ).catch(console.error);
  }

  revalidatePath('/admin/tutor-applications');
  revalidatePath('/api/student/tutors');
  return { success: true };
}

// ============================================
// Admin: Reject Application
// ============================================

export async function rejectTutorApplication(rawInput: unknown) {
  await requireAdmin();

  const input = rejectApplicationSchema.parse(rawInput);

  const application = await prisma.tutorApplication.findUnique({
    where: { id: input.applicationId },
    include: {
      user: { select: { id: true, email: true } },
    },
  });

  if (!application) throw new Error('Application not found');
  if (application.status !== 'PENDING' && application.status !== 'UNDER_REVIEW') {
    throw new Error('Only pending or under-review applications can be rejected');
  }

  await prisma.tutorApplication.update({
    where: { id: input.applicationId },
    data: {
      status: 'REJECTED',
      rejectionReason: input.rejectionReason,
      adminNotes: input.adminNotes,
      reviewedAt: new Date(),
      decidedAt: new Date(),
    },
  });

  // Send rejection email to the applicant
  const rejectedEmail = createRejectedEmail(
    application.user.email,
    application.fullName,
    input.rejectionReason
  );
  await sendTutorApplicationEmail(rejectedEmail).catch(console.error);

  revalidatePath('/admin/tutor-applications');
  return { success: true };
}

// ============================================
// Admin: Request More Info
// ============================================

export async function requestMoreInfo(rawInput: unknown) {
  await requireAdmin();

  const input = requestInfoSchema.parse(rawInput);

  const application = await prisma.tutorApplication.findUnique({
    where: { id: input.applicationId },
  });

  if (!application) throw new Error('Application not found');

  await prisma.tutorApplication.update({
    where: { id: input.applicationId },
    data: {
      status: 'PENDING',
      adminNotes: input.adminNotes,
    },
  });

  revalidatePath('/admin/tutor-applications');
  return { success: true };
}

// ============================================
// Admin: Get Application Stats
// ============================================

export async function getApplicationStats() {
  await requireAdmin();

  const counts = await prisma.tutorApplication.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  const stats = {
    PENDING: 0,
    UNDER_REVIEW: 0,
    APPROVED: 0,
    REJECTED: 0,
    WITHDRAWN: 0,
    total: 0,
  };

  for (const c of counts) {
    stats[c.status] = c._count.status;
    stats.total += c._count.status;
  }

  return stats;
}
