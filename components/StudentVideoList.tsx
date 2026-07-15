'use client';
import { useState } from 'react';
import { Video, Film, Calendar, User, AlertCircle } from 'lucide-react';
// Removed Youtube import - using Film instead

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source?: string | null;
  youtubeId?: string | null;
  createdAt: string;
  uploader: { name: string | null };
}

interface StudentVideoListProps {
  videos: Video[];
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/embed\/)([\w-]+)/,
    /(?:youtube\.com\/shorts\/)([\w-]+)/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

function getVideoType(url: string): string {
  if (url.endsWith('.webm')) return 'video/webm';
  if (url.endsWith('.mov')) return 'video/quicktime';
  if (url.endsWith('.avi')) return 'video/x-msvideo';
  return 'video/mp4';
}

export default function StudentVideoList({ videos }: StudentVideoListProps) {
  const [failedVideos, setFailedVideos] = useState<Set<string>>(new Set());

  const isYouTube = (video: Video) => {
    if (video.source === 'youtube') return true;
    if (video.youtubeId) return true;
    return video.url?.includes('youtube.com') || video.url?.includes('youtu.be');
  };

  const handleVideoError = (id: string) => {
    setFailedVideos((prev) => new Set(prev).add(id));
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <Video className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">No videos available</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Check back later for new videos.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => {
        const isYoutube = isYouTube(video);
        const youtubeId = video.youtubeId || extractYouTubeId(video.url);
        const hasFailed = failedVideos.has(video.id);

        return (
          <div
            key={video.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition group"
          >
            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black">
              {isYoutube && youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              ) : hasFailed ? (
                <div className="flex items-center justify-center h-full text-white bg-red-500/20 p-4 text-center">
                  <div>
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                    <p className="text-sm">Video unavailable</p>
                  </div>
                </div>
              ) : (
                <video
                  key={video.url}
                  controls
                  preload="metadata"
                  className="w-full h-full"
                  onError={() => handleVideoError(video.id)}
                >
                  <source src={video.url} type={getVideoType(video.url)} />
                  Your browser does not support the video tag.
                </video>
              )}
              
              {/* Source Badge */}
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  isYoutube
                    ? 'bg-red-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}>
                  {isYoutube ? (
                    <Film className="w-3 h-3" />
                  ) : (
                    <Film className="w-3 h-3" />
                  )}
                  {isYoutube ? 'YouTube' : 'Video'}
                </span>
              </div>
            </div>

            {/* Video Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">
                {video.title}
              </h3>
              {video.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                  {video.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <User className="w-3 h-3" />
                  {video.uploader?.name || 'Unknown'}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {new Date(video.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}