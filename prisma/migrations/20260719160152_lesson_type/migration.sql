-- AlterTable
ALTER TABLE "LectureSlide" ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "fileUrl" TEXT,
ALTER COLUMN "embedUrl" DROP NOT NULL;
