'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Calendar, User } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ✅ Changed to string
  author: { name: string | null };
}

interface AnnouncementListProps {
  announcements: Announcement[];
  isAdmin?: boolean;
}

export default function AnnouncementList({ announcements, isAdmin = false }: AnnouncementListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete announcement');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred');
    } finally {
      setDeleting(null);
    }
  };

  if (announcements.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <p className="text-gray-500 dark:text-gray-400 text-sm">No announcements yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition dark:bg-gray-800"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">
                {announcement.title}
              </h3>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {announcement.author.name || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm whitespace-pre-wrap">
                {announcement.content}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleDelete(announcement.id)}
                disabled={deleting === announcement.id}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition flex-shrink-0 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}