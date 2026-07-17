import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AnnouncementList from '@/components/AnnouncementList';
import PageHeader from '@/components/PageHeader';

export default async function StudentAnnouncementsPage() {
  await requireAuth(['STUDENT']);

  // ✅ Fetch all announcements
  const announcementsData = await prisma.announcement.findMany({
    include: {
      author: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // ✅ Serialize dates
  const announcements = announcementsData.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Announcements"
        description="Stay updated with the latest news and updates"
        // ❌ icon prop removed
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <AnnouncementList announcements={announcements} isAdmin={false} />
      </div>
    </div>
  );
}