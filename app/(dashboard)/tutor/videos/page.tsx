import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getScopeContext, buildCourseResourceScopeWhere } from '@/lib/auth/scope';
import { Video, Calendar, Users, Clock } from 'lucide-react';

export default async function TutorVideosPage() {
  await requireAuth(['TUTOR']);

  const scope = await getScopeContext();
  const where = buildCourseResourceScopeWhere(scope);

  let videosData: any[] = [];
  try {
    videosData = await prisma.video.findMany({
      where,
      include: {
        course: {
          select: { code: true, title: true },
        },
        uploader: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch (err) {
    console.error('[TutorVideos] Failed to fetch videos:', err);
  }

  const videos = (Array.isArray(videosData) ? videosData : []).map((v: any) => ({
    ...v,
    createdAt: v.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Videos</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          View published videos you can reference for tutoring
        </p>
      </div>

      {videos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Video className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No videos available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Videos will appear here when they are published
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((video: any) => (
            <div
              key={video.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Video className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {video.course && (
                      <>
                        <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                          {video.course.code}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {video.course.title}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {video.uploader?.name || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
