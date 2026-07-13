'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source?: string | null;
  youtubeId?: string | null;
  createdAt: string;
  uploader: {
    name: string | null;
  };
}

interface VideoListProps {
  videos: Video[];
  isAdmin?: boolean;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/embed\/)([\w-]+)/,
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

export default function VideoList({ videos, isAdmin = false }: VideoListProps) {
  const router = useRouter();
  const [failedVideos, setFailedVideos] = useState<Set<string>>(new Set());

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
        window.location.reload();
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    }
  };

  const isYouTube = (video: Video) => {
    if (video.source === 'youtube') return true;
    if (video.youtubeId) return true;
    return video.url?.includes('youtube.com') || video.url?.includes('youtu.be');
  };

  const handleVideoError = (id: string) => {
    setFailedVideos((prev) => new Set(prev).add(id));
    console.error(`Video failed to load: ${id}`);
  };

  if (videos.length === 0) {
    return <p className="text-gray-500 text-center py-8 text-sm md:text-base">No videos uploaded yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {videos.map((video) => {
        const isYoutube = isYouTube(video);
        const youtubeId = video.youtubeId || extractYouTubeId(video.url);
        const hasFailed = failedVideos.has(video.id);

        return (
          <div
            key={video.id}
            className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {isYoutube && youtubeId ? (
              <div className="relative w-full aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>
            ) : (
              <div className="relative w-full aspect-video bg-black">
                {!video.url ? (
                  <div className="flex items-center justify-center h-full text-white bg-red-500/20 p-2 text-center">
                    <p className="text-xs md:text-sm">⚠️ No video URL</p>
                  </div>
                ) : hasFailed ? (
                  <div className="flex items-center justify-center h-full text-white bg-red-500/20 p-2 text-center">
                    <p className="text-xs md:text-sm">❌ Video unavailable</p>
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
              </div>
            )}
            <div className="p-3 md:p-4">
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-sm md:text-lg font-semibold break-words">{video.title}</h3>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="text-red-600 hover:text-red-800 text-xs md:text-sm font-medium flex-shrink-0"
                  >
                    Delete
                  </button>
                )}
              </div>
              {video.description && (
                <p className="text-gray-600 text-xs md:text-sm mt-1">{video.description}</p>
              )}
              <div className="mt-2 text-xs text-gray-500 flex flex-wrap items-center gap-1">
                {isYoutube && (
                  <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] md:text-xs">
                    YouTube
                  </span>
                )}
                <span>
                  Uploaded by {video.uploader?.name || 'Unknown'} •{' '}
                  {new Date(video.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}