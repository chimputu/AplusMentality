-- Add joinSlug column to Institution table for magic join links

ALTER TABLE "Institution" ADD COLUMN "joinSlug" TEXT;
CREATE UNIQUE INDEX "Institution_joinSlug_key" ON "Institution"("joinSlug");
