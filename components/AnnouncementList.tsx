'use client';
import { useRouter } from 'next/navigation';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    name: string | null;
  };
}

interface AnnouncementListProps {
  announcements: Announcement[];
  isAdmin?: boolean;
}

export default function AnnouncementList({ announcements, isAdmin = false }: AnnouncementListProps) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const res = await fetch(`/api/announcements/${id}`, {
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

  if (announcements.length === 0) {
    return <p className="text-gray-500 text-center py-8">No announcements yet.</p>;
  }

  return (
    <div className="space-y-6">
      {announcements.map((announcement) => (
        <div key={announcement.id} className="border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-semibold">{announcement.title}</h3>
            {isAdmin && (
              <button
                onClick={() => handleDelete(announcement.id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Delete
              </button>
            )}
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
          <div className="mt-3 text-sm text-gray-500">
            Posted by {announcement.author.name || 'Unknown'} •{' '}
            {new Date(announcement.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ))}
    </div>
  );
}