import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Megaphone, Calendar, User } from 'lucide-react';

export default async function TutorAnnouncementsPage() {
  await requireAuth(['TUTOR', 'LECTURER']);

  let announcementsData: any[] = [];
  try {
    announcementsData = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: {
          select: { name: true },
        },
      },
    });
  } catch (err) {
    console.error('[TutorAnnouncements] Failed to fetch announcements:', err);
  }

  const announcements = (Array.isArray(announcementsData) ? announcementsData : []).map((a: any) => ({
    ...a,
    createdAt: a.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Announcements</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Stay updated with the latest announcements
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Megaphone className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No announcements
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Announcements will appear here when they are published
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement: any) => (
            <div
              key={announcement.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {announcement.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {announcement.author?.name || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
