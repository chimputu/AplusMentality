'use client';
import { useRouter } from 'next/navigation';

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  createdAt: string;
  uploader: {
    name: string | null;
  };
}

interface VideoListProps {
  videos: Video[];
  isAdmin?: boolean;
}

export default function VideoList({ videos, isAdmin = false }: VideoListProps) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // ✅ Refresh the page to fetch fresh data
        router.refresh();
        // ✅ Also reload the page to clear any cached search results
        window.location.reload();
      } else {
        alert('Failed to delete');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    }
  };

  if (videos.length === 0) {
    return <p className="text-gray-500 text-center py-8">No videos uploaded yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {videos.map((video) => (
        <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <video
            controls
            src={video.url}
            className="w-full aspect-video bg-black"
          />
          <div className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold">{video.title}</h3>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(video.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              )}
            </div>
            {video.description && (
              <p className="text-gray-600 text-sm mt-1">{video.description}</p>
            )}
            <div className="mt-2 text-xs text-gray-500">
              Uploaded by {video.uploader.name || 'Unknown'} •{' '}
              {new Date(video.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}