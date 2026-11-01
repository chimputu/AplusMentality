/*
  Warnings:

  - A unique constraint covering the columns `[assignmentId,userId]` on the table `AssignmentSubmission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[testId,userId]` on the table `TestSubmission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[joinSlug]` on the table `University` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "InstitutionChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TUTOR';

-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "AssignmentSubmission" DROP CONSTRAINT "AssignmentSubmission_userId_fkey";

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_userId_fkey";

-- DropForeignKey
ALTER TABLE "LectureSlide" DROP CONSTRAINT "LectureSlide_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "PastPaper" DROP CONSTRAINT "PastPaper_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "QuizSubmission" DROP CONSTRAINT "QuizSubmission_userId_fkey";

-- DropForeignKey
ALTER TABLE "Test" DROP CONSTRAINT "Test_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "TestSubmission" DROP CONSTRAINT "TestSubmission_userId_fkey";

-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_uploadedBy_fkey";

-- DropIndex
DROP INDEX "Assessment_createdAt_idx";

-- DropIndex
DROP INDEX "AssessmentAttempt_userId_idx";

-- DropIndex
DROP INDEX "AttemptOverride_assessmentId_userId_idx";

-- AlterTable
ALTER TABLE "AcademicLevel" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AcademicPeriod" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "institutionId" TEXT,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Answer" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ApplicationWindow" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Assessment" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AssessmentAttempt" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AssessmentItem" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "isPreview" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AssignmentSubmission" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AttemptOverride" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Banner" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BannerTarget" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Book" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Branch" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ChatConversation" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ChatMessage" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "tutorId" TEXT,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Enrollment" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ExplorationLog" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Faculty" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "FormResponse" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Institution" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "LectureSlide" ADD COLUMN     "isPreview" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Lesson" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "LessonCompletion" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Module" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "NotificationSeen" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "OrganizationMembership" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PastPaper" ADD COLUMN     "isPreview" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PendingUpload" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Programme" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Question" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "QuestionOption" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "isPreview" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "QuizSubmission" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SavedBook" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "isPreview" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TestSubmission" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Tutor" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TutorApplication" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TutorOffering" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TutorReference" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TutorRequest" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TutorSpecialty" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TutorialSheet" ADD COLUMN     "isPreview" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "University" ADD COLUMN     "joinSlug" TEXT,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "isPreview" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionChangeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentInstitutionId" TEXT,
    "currentProgrammeId" TEXT,
    "currentYear" INTEGER,
    "currentPeriod" TEXT,
    "newInstitutionId" TEXT,
    "newProgrammeId" TEXT,
    "newYear" INTEGER,
    "newPeriod" TEXT,
    "reason" TEXT,
    "status" "InstitutionChangeStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "InstitutionChangeRequest_userId_status_idx" ON "InstitutionChangeRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "InstitutionChangeRequest_status_idx" ON "InstitutionChangeRequest"("status");

-- CreateIndex
CREATE INDEX "InstitutionChangeRequest_createdAt_idx" ON "InstitutionChangeRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Announcement_institutionId_idx" ON "Announcement"("institutionId");

-- CreateIndex
CREATE INDEX "Assignment_courseId_isPreview_idx" ON "Assignment"("courseId", "isPreview");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentSubmission_assignmentId_userId_key" ON "AssignmentSubmission"("assignmentId", "userId");

-- CreateIndex
CREATE INDEX "LectureSlide_courseId_isPreview_idx" ON "LectureSlide"("courseId", "isPreview");

-- CreateIndex
CREATE INDEX "PastPaper_courseId_isPreview_idx" ON "PastPaper"("courseId", "isPreview");

-- CreateIndex
CREATE INDEX "Quiz_courseId_isPreview_idx" ON "Quiz"("courseId", "isPreview");

-- CreateIndex
CREATE INDEX "Test_courseId_isPreview_idx" ON "Test"("courseId", "isPreview");

-- CreateIndex
CREATE UNIQUE INDEX "TestSubmission_testId_userId_key" ON "TestSubmission"("testId", "userId");

-- CreateIndex
CREATE INDEX "TutorialSheet_courseId_isPreview_idx" ON "TutorialSheet"("courseId", "isPreview");

-- CreateIndex
CREATE UNIQUE INDEX "University_joinSlug_key" ON "University"("joinSlug");

-- CreateIndex
CREATE INDEX "Video_courseId_isPreview_idx" ON "Video"("courseId", "isPreview");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureSlide" ADD CONSTRAINT "LectureSlide_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizSubmission" ADD CONSTRAINT "QuizSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSubmission" ADD CONSTRAINT "TestSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastPaper" ADD CONSTRAINT "PastPaper_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSeen" ADD CONSTRAINT "NotificationSeen_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionChangeRequest" ADD CONSTRAINT "InstitutionChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionChangeRequest" ADD CONSTRAINT "InstitutionChangeRequest_currentInstitutionId_fkey" FOREIGN KEY ("currentInstitutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionChangeRequest" ADD CONSTRAINT "InstitutionChangeRequest_newInstitutionId_fkey" FOREIGN KEY ("newInstitutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionChangeRequest" ADD CONSTRAINT "InstitutionChangeRequest_newProgrammeId_fkey" FOREIGN KEY ("newProgrammeId") REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "QuizSubmission_quizId_userId_unique" RENAME TO "QuizSubmission_quizId_userId_key";
