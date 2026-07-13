import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import AdminContent from '@/components/AdminContent';

interface SearchParams {
  tab?: string;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const { user, role } = await requireAuth(['ADMIN']);
  const params = await searchParams;
  const activeTab = params?.tab || 'dashboard';

  // Fetch data on the server
  const [announcementsData, videosData, usersData] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } },
    }),
    prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      include: { uploader: { select: { name: true } } },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Serialize dates
  const announcements = announcementsData.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  const videos = videosData.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }));

  const users = usersData.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  // Get user's display name
  const displayName = user?.name || user?.email?.split('@')[0] || 'Admin';

  return (
    <DashboardLayout role={role}>
      <AdminContent
        announcements={announcements}
        videos={videos}
        users={users}
        activeTab={activeTab}
        displayName={displayName}
        role={role}
      />
    </DashboardLayout>
  );
}