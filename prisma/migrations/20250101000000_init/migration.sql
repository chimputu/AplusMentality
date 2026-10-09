-- Complete migration for A+ Mentality schema
-- This migration creates all tables, enums, and indexes from scratch
-- It is idempotent and safe to run on both fresh and existing databases

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPER_ADMIN', 'STUDENT');

CREATE TYPE "FormType" AS ENUM ('QUIZ', 'TEST', 'ASSIGNMENT');

CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'GRADED', 'RETURNED');

CREATE TYPE "PendingUploadStatus" AS ENUM ('UNTAGGED', 'TAGGED', 'ARCHIVED');

CREATE TYPE "AcademicSystem" AS ENUM ('YEARLY', 'SEMESTERLY', 'TRIMESTERLY');

CREATE TYPE "InstitutionType" AS ENUM ('UNIVERSITY', 'COLLEGE', 'POLYTECHNIC', 'INSTITUTE', 'MEDICAL_SCHOOL', 'BUSINESS_SCHOOL', 'TECHNICAL_COLLEGE', 'VOCATIONAL_SCHOOL');

CREATE TYPE "LevelType" AS ENUM ('YEAR', 'STAGE', 'PHASE', 'GRADE');

CREATE TYPE "PeriodType" AS ENUM ('SEMESTER', 'TERM', 'TRIMESTER', 'QUARTER', 'BLOCK');

CREATE TYPE "AssessmentType" AS ENUM ('QUIZ', 'TEST', 'EXAM', 'ASSIGNMENT', 'PRACTICE');

CREATE TYPE "AssessmentMode" AS ENUM ('GOOGLE_FORM', 'NATIVE');

CREATE TYPE "LiveStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'CANCELLED');

CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'IMAGE_CHOICE', 'FILE_UPLOAD', 'FILL_IN_BLANK', 'MATCHING', 'NUMERIC');

CREATE TYPE "ResultReveal" AS ENUM ('IMMEDIATELY', 'AFTER_CLOSE', 'AFTER_MANUAL', 'NEVER');

CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'ABANDONED');

CREATE TYPE "AssessmentSource" AS ENUM ('NATIVE', 'GOOGLE_FORM', 'MICROSOFT_FORM', 'EXTERNAL_LINK');

CREATE TYPE "BannerVariant" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'DANGER', 'PROMO');

CREATE TYPE "BannerPlacement" AS ENUM ('HOMEPAGE', 'DASHBOARD', 'BOTH');

CREATE TYPE "BannerScope" AS ENUM ('GLOBAL', 'ALL', 'SPECIFIC');

-- ============================================
-- TABLES
-- ============================================

-- User
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "name" TEXT,
    "imageUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "theme" TEXT DEFAULT 'system',
    "universityId" TEXT,
    "institutionId" TEXT,
    "programmeId" TEXT,
    "branchId" TEXT,
    "year" INTEGER,
    "period" TEXT,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "clerkOrgId" TEXT,
    "clerkOrgRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_institutionId_role_idx" ON "User"("institutionId", "role");
CREATE INDEX "User_clerkOrgId_idx" ON "User"("clerkOrgId");

-- Announcement
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");
CREATE INDEX "Announcement_authorId_idx" ON "Announcement"("authorId");

-- Video
CREATE TABLE "Video" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cloudinaryId" TEXT,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "source" TEXT,
    "youtubeId" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "courseId" TEXT,
    "order" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Video_createdAt_idx" ON "Video"("createdAt");
CREATE INDEX "Video_uploadedBy_idx" ON "Video"("uploadedBy");
CREATE INDEX "Video_source_idx" ON "Video"("source");
CREATE INDEX "Video_courseId_idx" ON "Video"("courseId");

-- Institution
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortName" TEXT,
    "type" "InstitutionType" NOT NULL DEFAULT 'UNIVERSITY',
    "description" TEXT,
    "country" TEXT DEFAULT 'Zambia',
    "province" TEXT,
    "city" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "logoUrl" TEXT,
    "levelType" "LevelType" NOT NULL DEFAULT 'YEAR',
    "numLevels" INTEGER NOT NULL DEFAULT 4,
    "periodType" "PeriodType" NOT NULL DEFAULT 'SEMESTER',
    "numPeriods" INTEGER NOT NULL DEFAULT 2,
    "hasFaculties" BOOLEAN NOT NULL DEFAULT false,
    "hasBranches" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "clerkOrgId" TEXT,
    "clerkOrgSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Institution_slug_key" ON "Institution"("slug");
CREATE UNIQUE INDEX "Institution_clerkOrgId_key" ON "Institution"("clerkOrgId");
CREATE INDEX "Institution_slug_idx" ON "Institution"("slug");
CREATE INDEX "Institution_type_idx" ON "Institution"("type");
CREATE INDEX "Institution_isActive_isVerified_idx" ON "Institution"("isActive", "isVerified");
CREATE INDEX "Institution_city_idx" ON "Institution"("city");

-- University
CREATE TABLE "University" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "academicSystem" "AcademicSystem" NOT NULL DEFAULT 'SEMESTERLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "University_code_key" ON "University"("code");
CREATE INDEX "University_academicSystem_idx" ON "University"("academicSystem");

-- Faculty
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "institutionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Faculty_institutionId_code_key" ON "Faculty"("institutionId", "code");
CREATE INDEX "Faculty_institutionId_idx" ON "Faculty"("institutionId");

-- Programme
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "code" TEXT,
    "universityId" TEXT,
    "institutionId" TEXT,
    "facultyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Programme_institutionId_code_key" ON "Programme"("institutionId", "code");
CREATE INDEX "Programme_universityId_idx" ON "Programme"("universityId");
CREATE INDEX "Programme_institutionId_idx" ON "Programme"("institutionId");
CREATE INDEX "Programme_facultyId_idx" ON "Programme"("facultyId");

-- Branch
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Branch_programmeId_name_key" ON "Branch"("programmeId", "name");
CREATE INDEX "Branch_programmeId_idx" ON "Branch"("programmeId");

-- AcademicLevel
CREATE TABLE "AcademicLevel" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "institutionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicLevel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademicLevel_institutionId_order_key" ON "AcademicLevel"("institutionId", "order");
CREATE INDEX "AcademicLevel_institutionId_order_idx" ON "AcademicLevel"("institutionId", "order");

-- AcademicPeriod
CREATE TABLE "AcademicPeriod" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "academicYear" INTEGER NOT NULL DEFAULT 2025,
    "institutionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicPeriod_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademicPeriod_institutionId_order_academicYear_key" ON "AcademicPeriod"("institutionId", "order", "academicYear");
CREATE INDEX "AcademicPeriod_institutionId_order_idx" ON "AcademicPeriod"("institutionId", "order");

-- Course
CREATE TABLE "Course" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "category" TEXT,
    "level" TEXT,
    "universityId" TEXT,
    "programmeId" TEXT,
    "levelId" TEXT,
    "periodId" TEXT,
    "yearNumber" INTEGER,
    "year" INTEGER,
    "period" TEXT,
    "createdBy" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Course_universityId_programmeId_year_period_code_key" ON "Course"("universityId", "programmeId", "year", "period", "code");
CREATE INDEX "Course_isPublished_idx" ON "Course"("isPublished");
CREATE INDEX "Course_createdAt_idx" ON "Course"("createdAt");
CREATE INDEX "Course_createdBy_idx" ON "Course"("createdBy");
CREATE INDEX "Course_universityId_idx" ON "Course"("universityId");
CREATE INDEX "Course_programmeId_idx" ON "Course"("programmeId");
CREATE INDEX "Course_programmeId_yearNumber_idx" ON "Course"("programmeId", "yearNumber");
CREATE INDEX "Course_levelId_idx" ON "Course"("levelId");
CREATE INDEX "Course_periodId_idx" ON "Course"("periodId");

-- Module
CREATE TABLE "Module" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Module_courseId_idx" ON "Module"("courseId");
CREATE INDEX "Module_order_idx" ON "Module"("order");
CREATE INDEX "Module_courseId_order_idx" ON "Module"("courseId", "order");

-- Lesson
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "moduleId" TEXT NOT NULL,
    "videoId" TEXT,
    "slidesId" TEXT,
    "quizId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lesson_moduleId_idx" ON "Lesson"("moduleId");
CREATE INDEX "Lesson_order_idx" ON "Lesson"("order");
CREATE INDEX "Lesson_moduleId_order_idx" ON "Lesson"("moduleId", "order");

-- LectureSlide
CREATE TABLE "LectureSlide" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "embedUrl" TEXT,
    "fileUrl" TEXT,
    "contentType" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "courseId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LectureSlide_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LectureSlide_courseId_idx" ON "LectureSlide"("courseId");
CREATE INDEX "LectureSlide_courseId_order_idx" ON "LectureSlide"("courseId", "order");
CREATE INDEX "LectureSlide_category_idx" ON "LectureSlide"("category");
CREATE INDEX "LectureSlide_createdAt_idx" ON "LectureSlide"("createdAt");
CREATE INDEX "LectureSlide_createdBy_idx" ON "LectureSlide"("createdBy");

-- Quiz
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "embedUrl" TEXT NOT NULL,
    "formUrl" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "fileUrl" TEXT,
    "contentType" TEXT,
    "createdBy" TEXT NOT NULL,
    "courseId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Quiz_createdAt_idx" ON "Quiz"("createdAt");
CREATE INDEX "Quiz_isPublished_idx" ON "Quiz"("isPublished");
CREATE INDEX "Quiz_courseId_idx" ON "Quiz"("courseId");

-- QuizSubmission
CREATE TABLE "QuizSubmission" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER,
    "total" INTEGER,
    "feedback" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,
    "responseId" TEXT,

    CONSTRAINT "QuizSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuizSubmission_userId_idx" ON "QuizSubmission"("userId");
CREATE INDEX "QuizSubmission_quizId_idx" ON "QuizSubmission"("quizId");

-- Test
CREATE TABLE "Test" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "embedUrl" TEXT NOT NULL,
    "formUrl" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "maxScore" INTEGER,
    "fileUrl" TEXT,
    "contentType" TEXT,
    "createdBy" TEXT NOT NULL,
    "courseId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Test_createdAt_idx" ON "Test"("createdAt");
CREATE INDEX "Test_isPublished_idx" ON "Test"("isPublished");
CREATE INDEX "Test_courseId_idx" ON "Test"("courseId");

-- TestSubmission
CREATE TABLE "TestSubmission" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "testId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER,
    "total" INTEGER,
    "feedback" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,
    "responseId" TEXT,

    CONSTRAINT "TestSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TestSubmission_userId_idx" ON "TestSubmission"("userId");
CREATE INDEX "TestSubmission_testId_idx" ON "TestSubmission"("testId");

-- Assignment
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "embedUrl" TEXT NOT NULL,
    "formUrl" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "maxScore" INTEGER,
    "fileUrl" TEXT,
    "contentType" TEXT,
    "createdBy" TEXT NOT NULL,
    "courseId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Assignment_createdAt_idx" ON "Assignment"("createdAt");
CREATE INDEX "Assignment_isPublished_idx" ON "Assignment"("isPublished");
CREATE INDEX "Assignment_courseId_idx" ON "Assignment"("courseId");
CREATE INDEX "Assignment_courseId_dueDate_idx" ON "Assignment"("courseId", "dueDate");

-- AssignmentSubmission
CREATE TABLE "AssignmentSubmission" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER,
    "total" INTEGER,
    "feedback" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,
    "responseId" TEXT,
    "fileUrl" TEXT,

    CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssignmentSubmission_userId_idx" ON "AssignmentSubmission"("userId");
CREATE INDEX "AssignmentSubmission_assignmentId_idx" ON "AssignmentSubmission"("assignmentId");

-- Enrollment
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Enrollment_courseId_userId_key" ON "Enrollment"("courseId", "userId");
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");
CREATE INDEX "Enrollment_enrolledAt_idx" ON "Enrollment"("enrolledAt");

-- LessonCompletion
CREATE TABLE "LessonCompletion" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonCompletion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LessonCompletion_userId_lessonId_key" ON "LessonCompletion"("userId", "lessonId");
CREATE INDEX "LessonCompletion_userId_idx" ON "LessonCompletion"("userId");
CREATE INDEX "LessonCompletion_lessonId_idx" ON "LessonCompletion"("lessonId");

-- PastPaper
CREATE TABLE "PastPaper" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "courseCode" TEXT,
    "year" INTEGER,
    "semester" TEXT,
    "category" TEXT NOT NULL DEFAULT 'final_exam',
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "createdBy" TEXT NOT NULL,
    "courseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PastPaper_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PastPaper_courseCode_idx" ON "PastPaper"("courseCode");
CREATE INDEX "PastPaper_year_idx" ON "PastPaper"("year");
CREATE INDEX "PastPaper_category_idx" ON "PastPaper"("category");
CREATE INDEX "PastPaper_createdAt_idx" ON "PastPaper"("createdAt");
CREATE INDEX "PastPaper_courseId_idx" ON "PastPaper"("courseId");

-- NotificationSeen
CREATE TABLE "NotificationSeen" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationSeen_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationSeen_userId_notificationId_key" ON "NotificationSeen"("userId", "notificationId");
CREATE INDEX "NotificationSeen_userId_idx" ON "NotificationSeen"("userId");
CREATE INDEX "NotificationSeen_notificationId_idx" ON "NotificationSeen"("notificationId");

-- Book
CREATE TABLE "Book" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "source" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT NOT NULL,
    "coverUrl" TEXT,
    "publishYear" INTEGER,
    "description" TEXT,
    "subjects" TEXT,
    "language" TEXT,
    "readUrl" TEXT,
    "downloadPdfUrl" TEXT,
    "downloadEpubUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Book_source_sourceId_key" ON "Book"("source", "sourceId");
CREATE INDEX "Book_title_idx" ON "Book"("title");
CREATE INDEX "Book_authors_idx" ON "Book"("authors");
CREATE INDEX "Book_source_idx" ON "Book"("source");
CREATE INDEX "Book_createdAt_idx" ON "Book"("createdAt");

-- SavedBook
CREATE TABLE "SavedBook" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedBook_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SavedBook_userId_bookId_key" ON "SavedBook"("userId", "bookId");
CREATE INDEX "SavedBook_userId_idx" ON "SavedBook"("userId");
CREATE INDEX "SavedBook_bookId_idx" ON "SavedBook"("bookId");
CREATE INDEX "SavedBook_savedAt_idx" ON "SavedBook"("savedAt");

-- PendingUpload
CREATE TABLE "PendingUpload" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "suggestedCode" TEXT,
    "status" "PendingUploadStatus" NOT NULL DEFAULT 'UNTAGGED',
    "courseId" TEXT,
    "contentType" TEXT,
    "order" INTEGER,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taggedAt" TIMESTAMP(3),

    CONSTRAINT "PendingUpload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PendingUpload_status_idx" ON "PendingUpload"("status");
CREATE INDEX "PendingUpload_uploadedBy_idx" ON "PendingUpload"("uploadedBy");
CREATE INDEX "PendingUpload_createdAt_idx" ON "PendingUpload"("createdAt");

-- TutorialSheet
CREATE TABLE "TutorialSheet" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorialSheet_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TutorialSheet_courseId_number_idx" ON "TutorialSheet"("courseId", "number");

-- Assessment
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
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

CREATE INDEX "Assessment_courseId_type_mode_isPublished_idx" ON "Assessment"("courseId", "type", "mode", "isPublished");
CREATE INDEX "Assessment_createdAt_idx" ON "Assessment"("createdAt");

-- Question
CREATE TABLE "Question" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Question_assessmentId_order_idx" ON "Question"("assessmentId", "order");
CREATE INDEX "Question_courseId_idx" ON "Question"("courseId");
CREATE INDEX "Question_type_idx" ON "Question"("type");
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");

-- QuestionOption
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuestionOption_questionId_idx" ON "QuestionOption"("questionId");

-- AssessmentItem
CREATE TABLE "AssessmentItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "assessmentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "pointsOverride" INTEGER,

    CONSTRAINT "AssessmentItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentItem_assessmentId_questionId_key" ON "AssessmentItem"("assessmentId", "questionId");
CREATE INDEX "AssessmentItem_assessmentId_idx" ON "AssessmentItem"("assessmentId");

-- AssessmentAttempt
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
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

CREATE INDEX "AssessmentAttempt_assessmentId_userId_attemptNumber_idx" ON "AssessmentAttempt"("assessmentId", "userId", "attemptNumber");
CREATE INDEX "AssessmentAttempt_userId_idx" ON "AssessmentAttempt"("userId");

-- Answer
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
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

CREATE UNIQUE INDEX "Answer_attemptId_questionId_key" ON "Answer"("attemptId", "questionId");
CREATE INDEX "Answer_attemptId_idx" ON "Answer"("attemptId");

-- FormResponse
CREATE TABLE "FormResponse" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
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

CREATE INDEX "FormResponse_assessmentId_userId_idx" ON "FormResponse"("assessmentId", "userId");

-- AttemptOverride
CREATE TABLE "AttemptOverride" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "assessmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "extraAttempts" INTEGER NOT NULL DEFAULT 0,
    "waiveCooldown" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "grantedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttemptOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AttemptOverride_assessmentId_userId_key" ON "AttemptOverride"("assessmentId", "userId");
CREATE INDEX "AttemptOverride_assessmentId_userId_idx" ON "AttemptOverride"("assessmentId", "userId");

-- ChatConversation
CREATE TABLE "ChatConversation" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New conversation',
    "mode" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatConversation_userId_lastMessageAt_idx" ON "ChatConversation"("userId", "lastMessageAt");
CREATE INDEX "ChatConversation_userId_isArchived_idx" ON "ChatConversation"("userId", "isArchived");

-- ChatMessage
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isError" BOOLEAN NOT NULL DEFAULT false,
    "tokensUsed" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");

-- Tutor
CREATE TABLE "Tutor" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "profileImagePublicId" TEXT,
    "universityId" TEXT,
    "programmeId" TEXT,
    "branchId" TEXT,
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "availability" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'online',
    "contactVia" TEXT NOT NULL DEFAULT 'form',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tutor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tutor_userId_key" ON "Tutor"("userId");
CREATE UNIQUE INDEX "Tutor_email_key" ON "Tutor"("email");
CREATE INDEX "Tutor_universityId_isActive_idx" ON "Tutor"("universityId", "isActive");
CREATE INDEX "Tutor_isVerified_isActive_idx" ON "Tutor"("isVerified", "isActive");

-- TutorSpecialty
CREATE TABLE "TutorSpecialty" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "tutorId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "personalEnabled" BOOLEAN NOT NULL DEFAULT true,
    "personalRate" DECIMAL(10,2),
    "groupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "groupRate" DECIMAL(10,2),
    "groupMinSize" INTEGER,
    "groupMaxSize" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'ZMW',
    "notes" TEXT,

    CONSTRAINT "TutorSpecialty_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TutorSpecialty_tutorId_courseId_key" ON "TutorSpecialty"("tutorId", "courseId");
CREATE INDEX "TutorSpecialty_courseId_idx" ON "TutorSpecialty"("courseId");

-- TutorRequest
CREATE TABLE "TutorRequest" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "tutorId" TEXT NOT NULL,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "studentPhone" TEXT,
    "courseId" TEXT,
    "courseNeeded" TEXT,
    "sessionType" TEXT NOT NULL DEFAULT 'PERSONAL',
    "quotedRate" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'ZMW',
    "preferredAt" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TutorRequest_tutorId_status_idx" ON "TutorRequest"("tutorId", "status");
CREATE INDEX "TutorRequest_createdAt_idx" ON "TutorRequest"("createdAt");
CREATE INDEX "TutorRequest_sessionType_idx" ON "TutorRequest"("sessionType");

-- Banner
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "institutionId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "imageUrl" TEXT,
    "variant" "BannerVariant" NOT NULL DEFAULT 'INFO',
    "placement" "BannerPlacement" NOT NULL DEFAULT 'HOMEPAGE',
    "scope" "BannerScope" NOT NULL DEFAULT 'SPECIFIC',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Banner_placement_isActive_startsAt_endsAt_idx" ON "Banner"("placement", "isActive", "startsAt", "endsAt");
CREATE INDEX "Banner_institutionId_idx" ON "Banner"("institutionId");
CREATE INDEX "Banner_scope_idx" ON "Banner"("scope");

-- BannerTarget
CREATE TABLE "BannerTarget" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "bannerId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannerTarget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BannerTarget_bannerId_institutionId_key" ON "BannerTarget"("bannerId", "institutionId");
CREATE INDEX "BannerTarget_institutionId_idx" ON "BannerTarget"("institutionId");

-- OrganizationMembership
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "clerkOrgId" TEXT NOT NULL,
    "clerkOrgSlug" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationMembership_userId_clerkOrgId_key" ON "OrganizationMembership"("userId", "clerkOrgId");
CREATE INDEX "OrganizationMembership_clerkOrgId_status_idx" ON "OrganizationMembership"("clerkOrgId", "status");
CREATE INDEX "OrganizationMembership_userId_idx" ON "OrganizationMembership"("userId");

-- ============================================
-- FOREIGN KEYS
-- ============================================

ALTER TABLE "User" ADD CONSTRAINT "User_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Video" ADD CONSTRAINT "Video_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Video" ADD CONSTRAINT "Video_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Course" ADD CONSTRAINT "Course_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "AcademicLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AcademicPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Module" ADD CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_slidesId_fkey" FOREIGN KEY ("slidesId") REFERENCES "LectureSlide"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LectureSlide" ADD CONSTRAINT "LectureSlide_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LectureSlide" ADD CONSTRAINT "LectureSlide_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuizSubmission" ADD CONSTRAINT "QuizSubmission_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizSubmission" ADD CONSTRAINT "QuizSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Test" ADD CONSTRAINT "Test_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Test" ADD CONSTRAINT "Test_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TestSubmission" ADD CONSTRAINT "TestSubmission_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestSubmission" ADD CONSTRAINT "TestSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LessonCompletion" ADD CONSTRAINT "LessonCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonCompletion" ADD CONSTRAINT "LessonCompletion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PastPaper" ADD CONSTRAINT "PastPaper_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PastPaper" ADD CONSTRAINT "PastPaper_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NotificationSeen" ADD CONSTRAINT "NotificationSeen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedBook" ADD CONSTRAINT "SavedBook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedBook" ADD CONSTRAINT "SavedBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Programme" ADD CONSTRAINT "Programme_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Branch" ADD CONSTRAINT "Branch_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AcademicLevel" ADD CONSTRAINT "AcademicLevel_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AcademicPeriod" ADD CONSTRAINT "AcademicPeriod_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PendingUpload" ADD CONSTRAINT "PendingUpload_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TutorialSheet" ADD CONSTRAINT "TutorialSheet_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Question" ADD CONSTRAINT "Question_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssessmentItem" ADD CONSTRAINT "AssessmentItem_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentItem" ADD CONSTRAINT "AssessmentItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Answer" ADD CONSTRAINT "Answer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AttemptOverride" ADD CONSTRAINT "AttemptOverride_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TutorSpecialty" ADD CONSTRAINT "TutorSpecialty_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TutorSpecialty" ADD CONSTRAINT "TutorSpecialty_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TutorRequest" ADD CONSTRAINT "TutorRequest_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TutorRequest" ADD CONSTRAINT "TutorRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Banner" ADD CONSTRAINT "Banner_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BannerTarget" ADD CONSTRAINT "BannerTarget_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BannerTarget" ADD CONSTRAINT "BannerTarget_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
