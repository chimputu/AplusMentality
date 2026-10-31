-- Add fileUrl column to QuizSubmission for uploaded answer files
ALTER TABLE "QuizSubmission" ADD COLUMN "fileUrl" TEXT;

-- Add unique constraint to prevent duplicate submissions per student per quiz
-- First, remove any existing duplicates (keep the earliest submission)
DELETE FROM "QuizSubmission"
WHERE ctid NOT IN (
  SELECT MIN(ctid)
  FROM "QuizSubmission"
  GROUP BY "quizId", "userId"
);

-- Now safe to add the unique constraint
ALTER TABLE "QuizSubmission" ADD CONSTRAINT "QuizSubmission_quizId_userId_unique" UNIQUE ("quizId", "userId");
