-- ============================================
-- ASSESSMENT ENGINE ENUMS
-- ============================================

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('QUIZ', 'TEST', 'EXAM', 'ASSIGNMENT', 'PRACTICE');

-- CreateEnum
CREATE TYPE "AssessmentMode" AS ENUM ('GOOGLE_FORM', 'NATIVE');

-- CreateEnum
CREATE TYPE "LiveStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'IMAGE_CHOICE', 'FILE_UPLOAD', 'FILL_IN_BLANK', 'MATCHING', 'NUMERIC');

-- CreateEnum
CREATE TYPE "ResultReveal" AS ENUM ('IMMEDIATELY', 'AFTER_CLOSE', 'AFTER_MANUAL', 'NEVER');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "AssessmentSource" AS ENUM ('NATIVE', 'GOOGLE_FORM', 'MICROSOFT_FORM', 'EXTERNAL_LINK');

-- ============================================
-- ALTER EXISTING TABLES
-- ============================================

-- Add SUPER_ADMIN to Role enum if it doesn't already exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUPER_ADMIN' AND enumtypid = 'Role'::regtype) THEN
    ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';
  END IF;
END $$;

-- ============================================
-- ASSESSMENT TABLE
-- ============================================

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AssessmentType" NOT NULL,
    "mode" "AssessmentMode" NOT NULL,
    "liveStatus" "LiveStatus" NOT NULL DEFAULT 'DRAFT',
    "courseId" TEXT NOT NULL,
    "embedUrl" TEXT,
    "formUrl" TEXT,
    "fileUrl" TEXT,
    "contentType" TEXT,
    "timeLimit" INTEGER,
    "openAt" TIMESTAMP(3),
    "closeAt" TIMESTAMP(3),
    "maxGrade" INTEGER NOT NULL DEFAULT 100,
    "passingScore" INTEGER NOT NULL DEFAULT 50,
    "attemptsMax" INTEGER NOT NULL DEFAULT 1,
    "attemptCooldownHrs" INTEGER NOT NULL DEFAULT 0,
    "keepBestScore" BOOLEAN NOT NULL DEFAULT true,
    "shuffleQs" BOOLEAN NOT NULL DEFAULT false,
    "showAnswersAfter" "ResultReveal" NOT NULL DEFAULT 'IMMEDIATELY',
    "resultsReleasedAt" TIMESTAMP(3),
    "proctored" BOOLEAN NOT NULL DEFAULT false,
    "maxTabSwitches" INTEGER NOT NULL DEFAULT 3,
    "requireFullscreen" BOOLEAN NOT NULL DEFAULT false,
    "disableCopyPaste" BOOLEAN NOT NULL DEFAULT true,
    "requireCamera" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- QUESTION TABLE
-- ============================================

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "type" "QuestionType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "imageUrl" TEXT,
    "options" JSONB,
    "correctId" TEXT,
    "correctText" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "explanation" TEXT,
    "courseId" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "tags" JSONB,
    "acceptedAnswers" JSONB,
    "correctNumber" DOUBLE PRECISION,
    "tolerance" DOUBLE PRECISION,
    "matchingPairs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- QUESTION OPTION TABLE (normalized)
-- ============================================

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- ASSESSMENT ITEM TABLE (junction)
-- ============================================

-- CreateTable
CREATE TABLE "AssessmentItem" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "pointsOverride" INTEGER,

    CONSTRAINT "AssessmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateUnique
CREATE UNIQUE INDEX "AssessmentItem_assessmentId_questionId_key" ON "AssessmentItem"("assessmentId", "questionId");

-- ============================================
-- ASSESSMENT ATTEMPT TABLE
-- ============================================

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "isBest" BOOLEAN NOT NULL DEFAULT false,
    "previousId" TEXT,
    "answers" JSONB,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "timeSpent" INTEGER,
    "score" INTEGER,
    "totalPoints" INTEGER,
    "percentage" INTEGER,
    "passed" BOOLEAN,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,
    "feedback" TEXT,
    "tabSwitches" INTEGER NOT NULL DEFAULT 0,
    "fullscreenExits" INTEGER NOT NULL DEFAULT 0,
    "copyAttempts" INTEGER NOT NULL DEFAULT 0,
    "violations" JSONB,
    "autoSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "resultViewedAt" TIMESTAMP(3),

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- ANSWER TABLE (normalized)
-- ============================================

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "textAnswer" TEXT,
    "numericAnswer" DOUBLE PRECISION,
    "matchingAnswer" JSONB,
    "isCorrect" BOOLEAN,
    "pointsEarned" DOUBLE PRECISION,
    "feedback" TEXT,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateUnique
CREATE UNIQUE INDEX "Answer_attemptId_questionId_key" ON "Answer"("attemptId", "questionId");

-- ============================================
-- FORM RESPONSE TABLE
-- ============================================

-- CreateTable
CREATE TABLE "FormResponse" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "responseId" TEXT,
    "score" INTEGER,
    "total" INTEGER,
    "feedback" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,

    CONSTRAINT "FormResponse_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- ATTEMPT OVERRIDE TABLE
-- ============================================

-- CreateTable
CREATE TABLE "AttemptOverride" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "extraAttempts" INTEGER NOT NULL DEFAULT 0,
    "waiveCooldown" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "grantedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttemptOverride_pkey" PRIMARY KEY ("id")
);

-- CreateUnique
CREATE UNIQUE INDEX "AttemptOverride_assessmentId_userId_key" ON "AttemptOverride"("assessmentId", "userId");

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================

-- Assessment → Course
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Assessment → User (creator)
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Question → Assessment
ALTER TABLE "Question" ADD CONSTRAINT "Question_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- QuestionOption → Question
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AssessmentItem → Assessment
ALTER TABLE "AssessmentItem" ADD CONSTRAINT "AssessmentItem_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AssessmentItem → Question (Restrict delete if question is in use)
ALTER TABLE "AssessmentItem" ADD CONSTRAINT "AssessmentItem_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AssessmentAttempt → Assessment
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AssessmentAttempt → User
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Answer → AssessmentAttempt
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_attemptId_fkey"
    FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Answer → Question
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FormResponse → Assessment
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FormResponse → User
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AttemptOverride → Assessment
ALTER TABLE "AttemptOverride" ADD CONSTRAINT "AttemptOverride_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- INDEXES
-- ============================================

-- Assessment indexes
CREATE INDEX "Assessment_courseId_type_mode_isPublished_idx" ON "Assessment"("courseId", "type", "mode", "isPublished");
CREATE INDEX "Assessment_createdAt_idx" ON "Assessment"("createdAt");

-- Question indexes
CREATE INDEX "Question_assessmentId_order_idx" ON "Question"("assessmentId", "order");
CREATE INDEX "Question_courseId_idx" ON "Question"("courseId");
CREATE INDEX "Question_type_idx" ON "Question"("type");
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");

-- QuestionOption indexes
CREATE INDEX "QuestionOption_questionId_idx" ON "QuestionOption"("questionId");

-- AssessmentItem indexes
CREATE INDEX "AssessmentItem_assessmentId_idx" ON "AssessmentItem"("assessmentId");

-- AssessmentAttempt indexes
CREATE INDEX "AssessmentAttempt_assessmentId_userId_attemptNumber_idx" ON "AssessmentAttempt"("assessmentId", "userId", "attemptNumber");
CREATE INDEX "AssessmentAttempt_userId_idx" ON "AssessmentAttempt"("userId");

-- Answer indexes
CREATE INDEX "Answer_attemptId_idx" ON "Answer"("attemptId");

-- FormResponse indexes
CREATE INDEX "FormResponse_assessmentId_userId_idx" ON "FormResponse"("assessmentId", "userId");

-- AttemptOverride indexes
CREATE INDEX "AttemptOverride_assessmentId_userId_idx" ON "AttemptOverride"("assessmentId", "userId");
