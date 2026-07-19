-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "fileUrl" TEXT;

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "fileUrl" TEXT;

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "fileUrl" TEXT;
