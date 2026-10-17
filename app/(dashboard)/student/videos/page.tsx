'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import StudentVideoList from '@/components/StudentVideoList';

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail: string | null;
  source: string | null;
  youtubeId: string | null;
  createdAt: string;
  uploader: { name: string | null } | null;
  course: {
    id: string;
    code: string;
    title: string;
    university: { code: string; name: string } | null;
  } | null;
}

export default function StudentVideosPage() {
  const searchParams = useSearchParams();
  const universityFilter = searchParams.get('university') || '';
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (universityFilter) params.set('university', universityFilter);
    fetch(`/api/videos${params.toString() ? '?' + params.toString() : ''}`)
      .then(async (res) => {
        if (!res.ok) {
          console.error('Failed to fetch videos:', res.status);
          return [];
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
        console.error('Unexpected videos API response:', data);
        return [];
      })
      .then((data: Video[]) => {
        setVideos(data);
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [universityFilter]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Videos</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {universityFilter
            ? 'Watching videos filtered by selected university'
            : 'Watch all available videos'}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading videos...</div>
        ) : (
          <StudentVideoList videos={videos} />
        )}
      </div>
    </div>
  );
}