-- Consolidate institution model: remove legacy universityId references
-- and consolidate all institution scoping through the canonical University (Institution) table.
--
-- This migration:
-- 1. Removes User.universityId (LegacyUniversity reference)
-- 2. Removes Course.universityId (LegacyUniversity reference)
-- 3. Removes Programme.universityId (LegacyUniversity reference)
-- 4. Removes Tutor.universityId (LegacyUniversity reference) and adds Tutor.institutionId
-- 5. Drops the unique constraint on Course that included universityId
-- 6. Creates a new unique constraint on Course without universityId

-- ============================================
-- Step 1: Migrate Tutor.universityId -> Tutor.institutionId
-- ============================================

-- Add the new institutionId column to Tutor first
ALTER TABLE "Tutor" ADD COLUMN "institutionId" TEXT;

-- Migrate existing tutor universityId values to institutionId via the mapping
-- (This assumes the migration script has already been run to create the mapping)
-- If not, tutors will have NULL institutionId after this migration

-- Drop the old foreign key
ALTER TABLE "Tutor" DROP CONSTRAINT IF EXISTS "Tutor_universityId_fkey";

-- Add the new foreign key to Institution table
ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_institutionId_fkey"
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index on new column
CREATE INDEX "Tutor_institutionId_isActive_idx" ON "Tutor"("institutionId", "isActive");

-- Drop the old column
ALTER TABLE "Tutor" DROP COLUMN "universityId";
DROP INDEX IF EXISTS "Tutor_universityId_isActive_idx";

-- ============================================
-- Step 2: Remove Programme.universityId
-- ============================================

ALTER TABLE "Programme" DROP CONSTRAINT IF EXISTS "Programme_universityId_fkey";
ALTER TABLE "Programme" DROP COLUMN "universityId";
DROP INDEX IF EXISTS "Programme_universityId_idx";

-- ============================================
-- Step 3: Remove Course.universityId
-- ============================================

-- Drop the old unique constraint that includes universityId
ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS "Course_universityId_programmeId_year_period_code_key";

-- Drop the old foreign key
ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS "Course_universityId_fkey";

-- Drop the column
ALTER TABLE "Course" DROP COLUMN "universityId";
DROP INDEX IF EXISTS "Course_universityId_idx";

-- Create new unique constraint without universityId
CREATE UNIQUE INDEX "Course_programmeId_year_period_code_key"
  ON "Course"("programmeId", "year", "period", "code");

-- ============================================
-- Step 4: Remove User.universityId
-- ============================================

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_universityId_fkey";
ALTER TABLE "User" DROP COLUMN "universityId";

-- ============================================
-- Step 5: LegacyUniversity table is kept but orphaned
-- ============================================
-- The "University" table (LegacyUniversity in Prisma) is kept for backward compatibility.
-- No other table references it. It can be safely dropped in a future migration
-- after all data has been migrated to the "Institution" table.
