import { prisma } from '@/lib/prisma';
import VideoUploadForm from '@/components/VideoUploadForm';
import VideoList from '@/components/VideoList';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { Video } from 'lucide-react';

export default async function AdminVideosPage() {
  // ✅ NO AUTH - layout handles it
  // ✅ NO DashboardLayout - layout handles it

  const videosData = await prisma.video.findMany({
    include: {
      uploader: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const videos = videosData.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }));

  // ✅ Clean, focused content with consistent header
  return (
    <div className="space-y-8">
      <PageHeader
        title="Videos"
        description="Upload and manage videos"
        action={{
          label: 'Upload Video',
          href: '#upload',
        }}
      />

      <div id="upload" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 scroll-mt-20">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Upload New Video
        </h2>
        <VideoUploadForm />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            All Videos
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full">
            {videos.length} total
          </span>
        </div>
        {videos.length === 0 ? (
          <EmptyState
            icon={<Video className="w-10 h-10 text-gray-400 dark:text-gray-500" />}
            title="No videos yet"
            description="Upload your first video to get started!"
            action={{
              label: 'Upload Video',
              href: '#upload',
            }}
          />
        ) : (
          <VideoList videos={videos} isAdmin={true} />
        )}
      </div>
    </div>
  );
}