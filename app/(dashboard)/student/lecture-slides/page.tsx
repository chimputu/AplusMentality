import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import StudentLectureSlideList from '@/components/StudentLectureSlideList';

export default async function StudentLectureSlidesPage() {
  await requireAuth(['STUDENT']);

  const slidesData = await prisma.lectureSlide.findMany({
    include: {
      creator: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // ✅ Convert Date to string
  const slides = slidesData.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lecture Slides</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">View all lecture slides</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <StudentLectureSlideList slides={slides} />
      </div>
    </div>
  );
}