import { prisma } from '@/lib/prisma';
import AdminContent from '@/components/AdminContent';

interface SearchParams {
  tab?: string;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const activeTab = params?.tab || 'dashboard';

  // ✅ Fetch data - NO AUTH needed (layout handles it)
  const [announcementsData, videosData, usersData, coursesData] = await Promise.all([
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
    prisma.course.findMany({
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
        enrollments: true,
        creator: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // ✅ Serialize dates
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

  const courses = coursesData.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    modules: c.modules.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      lessons: m.lessons.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
    })),
    enrollments: c.enrollments.map((e) => ({
      ...e,
      enrolledAt: e.enrolledAt.toISOString(),
    })),
  }));

  // ✅ Return content only - NO DashboardLayout wrapper
  return (
    <AdminContent
      announcements={announcements}
      videos={videos}
      users={users}
      courses={courses}
      activeTab={activeTab}
      displayName="Admin"
      role="ADMIN"
    />
  );
}