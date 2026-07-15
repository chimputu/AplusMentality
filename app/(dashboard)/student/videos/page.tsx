import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import StudentVideoList from '@/components/StudentVideoList';

export default async function StudentVideosPage() {
  await requireAuth(['STUDENT']);

  const videosData = await prisma.video.findMany({
    include: {
      uploader: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // ✅ Convert Date to string
  const videos = videosData.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Videos</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Watch all available videos</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <StudentVideoList videos={videos} />
      </div>
    </div>
  );
}