import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CreateAnnouncementForm from '@/components/CreateAnnouncementForm';
import AnnouncementList from '@/components/AnnouncementList';

export default async function AdminAnnouncementsPage() {
  await requireAuth(['ADMIN']);

  // ✅ Fetch data
  const announcementsData = await prisma.announcement.findMany({
    include: {
      author: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // ✅ Convert Date to string for the component
  const announcements = announcementsData.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Announcements</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Create and manage announcements</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Create New Announcement</h2>
        <CreateAnnouncementForm />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">All Announcements</h2>
        <AnnouncementList announcements={announcements} isAdmin={true} />
      </div>
    </div>
  );
}