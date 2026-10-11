-- Migration to add tutor application system and related features

-- ============================================
-- ENUM CHANGES
-- ============================================

-- Add LECTURER to Role enum
ALTER TYPE "Role" ADD VALUE 'LECTURER';

-- Create TutorApplicationStatus enum
CREATE TYPE "TutorApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- ============================================
-- COLUMN ADDITIONS
-- ============================================

-- Add isVerifiedTutor to User
ALTER TABLE "User" ADD COLUMN "isVerifiedTutor" BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- NEW TABLES
-- ============================================

-- TutorApplication
CREATE TABLE "TutorApplication" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "institutionId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "qualifications" JSONB,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "cvUrl" TEXT,
    "cvPublicId" TEXT,
    "teachingPhilosophy" TEXT,
    "status" "TutorApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    -- Identity verification
    "profilePhotoUrl" TEXT,
    "profilePhotoPublicId" TEXT,
    "nrcFrontUrl" TEXT,
    "nrcFrontPublicId" TEXT,
    "nrcBackUrl" TEXT,
    "nrcBackPublicId" TEXT,
    "nrcNumber" TEXT,

    -- Grade 12 results
    "grade12School" TEXT,
    "grade12Year" INTEGER,
    "grade12ResultsUrl" TEXT,
    "grade12Summary" TEXT,

    -- Current academic records
    "currentInstitution" TEXT,
    "currentProgramme" TEXT,
    "currentYear" INTEGER,
    "academicRecordsUrl" TEXT,
    "academicSummary" TEXT,

    -- Teaching modes
    "teachingModes" TEXT[],
    "physicalLocation" TEXT,

    -- Teaching schedule
    "teachingSchedule" JSONB,

    -- Pricing
    "hourlyRateZMW" INTEGER,
    "minimumBookingHours" INTEGER,

    -- Admin control
    "isReadyToTeach" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TutorApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TutorApplication_userId_key" ON "TutorApplication"("userId");
CREATE INDEX "TutorApplication_status_idx" ON "TutorApplication"("status");
CREATE INDEX "TutorApplication_institutionId_idx" ON "TutorApplication"("institutionId");
CREATE INDEX "TutorApplication_submittedAt_idx" ON "TutorApplication"("submittedAt");

-- TutorReference
CREATE TABLE "TutorReference" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "tutorApplicationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "institution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorReference_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TutorReference_tutorApplicationId_idx" ON "TutorReference"("tutorApplicationId");

-- TutorOffering
CREATE TABLE "TutorOffering" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "tutorApplicationId" TEXT NOT NULL,
    "courseId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "priceZMW" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxStudentsPerSession" INTEGER NOT NULL DEFAULT 1,
    "modes" TEXT[],
    "schedule" JSONB,
    "prerequisites" TEXT,
    "learningOutcomes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorOffering_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TutorOffering_tutorApplicationId_idx" ON "TutorOffering"("tutorApplicationId");
CREATE INDEX "TutorOffering_courseId_idx" ON "TutorOffering"("courseId");

-- ApplicationWindow
CREATE TABLE "ApplicationWindow" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "institutionId" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "publicMessage" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationWindow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApplicationWindow_institutionId_isOpen_idx" ON "ApplicationWindow"("institutionId", "isOpen");
CREATE INDEX "ApplicationWindow_opensAt_closesAt_idx" ON "ApplicationWindow"("opensAt", "closesAt");

-- ExplorationLog
CREATE TABLE "ExplorationLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'VIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExplorationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExplorationLog_userId_createdAt_idx" ON "ExplorationLog"("userId", "createdAt");
CREATE INDEX "ExplorationLog_institutionId_idx" ON "ExplorationLog"("institutionId");

-- ============================================
-- FOREIGN KEYS
-- ============================================

ALTER TABLE "TutorApplication" ADD CONSTRAINT "TutorApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TutorApplication" ADD CONSTRAINT "TutorApplication_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TutorReference" ADD CONSTRAINT "TutorReference_tutorApplicationId_fkey" FOREIGN KEY ("tutorApplicationId") REFERENCES "TutorApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TutorOffering" ADD CONSTRAINT "TutorOffering_tutorApplicationId_fkey" FOREIGN KEY ("tutorApplicationId") REFERENCES "TutorApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TutorOffering" ADD CONSTRAINT "TutorOffering_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ApplicationWindow" ADD CONSTRAINT "ApplicationWindow_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExplorationLog" ADD CONSTRAINT "ExplorationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
