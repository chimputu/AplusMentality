-- Add missing fields to Question model for question bank support
ALTER TABLE "Question" ADD COLUMN "courseId" TEXT;
ALTER TABLE "Question" ADD COLUMN "difficulty" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Question" ADD COLUMN "tags" JSONB;
ALTER TABLE "Question" ADD COLUMN "acceptedAnswers" JSONB;
ALTER TABLE "Question" ADD COLUMN "correctNumber" DOUBLE PRECISION;
ALTER TABLE "Question" ADD COLUMN "tolerance" DOUBLE PRECISION;
ALTER TABLE "Question" ADD COLUMN "matchingPairs" JSONB;
ALTER TABLE "Question" ADD COLUMN "updatedAt" TIMESTAMP(3);

-- Add indexes for question bank queries
CREATE INDEX "Question_courseId_idx" ON "Question"("courseId");
CREATE INDEX "Question_type_idx" ON "Question"("type");
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");
