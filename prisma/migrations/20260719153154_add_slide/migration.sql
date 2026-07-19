-- AlterTable
ALTER TABLE "LectureSlide" ADD COLUMN     "category" TEXT,
ADD COLUMN     "courseId" TEXT;

-- CreateIndex
CREATE INDEX "LectureSlide_courseId_idx" ON "LectureSlide"("courseId");

-- CreateIndex
CREATE INDEX "LectureSlide_category_idx" ON "LectureSlide"("category");

-- AddForeignKey
ALTER TABLE "LectureSlide" ADD CONSTRAINT "LectureSlide_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
