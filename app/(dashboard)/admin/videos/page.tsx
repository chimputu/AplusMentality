import { prisma } from '@/lib/prisma';
import VideoUploadForm from '@/components/VideoUploadForm';
import VideoList from '@/components/VideoList';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { Video } from 'lucide-react';

export default async function AdminVideosPage() {
  // Auth handled by layout (ADMIN + SUPER_ADMIN)
  let videosData: any[] = [];
  let universities: any[] = [];
  try {
    videosData = await prisma.video.findMany({
      include: {
        uploader: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('[AdminVideos] Failed to fetch videos:', err);
  }

  const videos = (Array.isArray(videosData) ? videosData : []).map((v) => ({
    ...v,
    createdAt: v.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  // Load universities server-side for the upload form dropdown
  try {
    universities = await prisma.university.findMany({
      orderBy: { name: 'asc' },
      include: {
        programmes: {
          orderBy: { name: 'asc' },
        },
      },
    });
  } catch (err) {
    console.error('[AdminVideos] Failed to fetch universities:', err);
  }

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

      <div id="upload" className="bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border p-6 scroll-mt-20">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-foreground mb-4">
          Upload New Video
        </h2>
        <VideoUploadForm universities={universities} />
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-foreground">
            All Videos
          </h2>
          <span className="text-xs text-muted-foreground bg-gray-50 dark:bg-muted px-3 py-1 rounded-full">
            {videos.length} total
          </span>
        </div>
        {videos.length === 0 ? (
          <EmptyState
            icon={<Video className="w-10 h-10 text-gray-400 dark:text-muted-foreground" />}
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