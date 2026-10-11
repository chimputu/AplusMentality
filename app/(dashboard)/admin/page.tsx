import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import AdminContent from '@/components/AdminContent';
import * as Sentry from '@sentry/nextjs';

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

  // Get current user's institution for banner targeting
  const { userId } = await auth();
  let userInstitutionId: string | undefined;
  if (userId) {
    try {
      const user = await prisma.user.findUnique({ where: { clerkId: userId } });
      userInstitutionId = user?.institutionId || undefined;
    } catch (err) {
      console.error('Failed to fetch user institution:', err);
      Sentry.captureException(err);
    }
  }

  // ✅ Fetch data with error handling - NO AUTH needed (layout handles it)
  let announcementsData: any[] = [];
  let videosData: any[] = [];
  let usersData: any[] = [];
  let coursesData: any[] = [];

  try {
    [announcementsData, videosData, usersData, coursesData] = await Promise.all([
      prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true } } },
      }).catch((): any[] => {
        console.error('Failed to fetch announcements');
        return [];
      }),
      prisma.video.findMany({
        orderBy: { createdAt: 'desc' },
        include: { uploader: { select: { name: true } } },
      }).catch((): any[] => {
        console.error('Failed to fetch videos');
        return [];
      }),
      prisma.user.findMany({
        select: {
          id: true,
          clerkId: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          name: true,
          imageUrl: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }).catch((): any[] => {
        console.error('Failed to fetch users');
        return [];
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
      }).catch((): any[] => {
        console.error('Failed to fetch courses');
        return [];
      }),
    ]);
  } catch (err) {
    console.error('Failed to fetch admin data:', err);
    Sentry.captureException(err);
  }

  // ✅ Serialize dates safely
  const announcements = announcementsData.map((a) => ({
    ...a,
    createdAt: a.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  const videos = videosData.map((v) => ({
    ...v,
    createdAt: v.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  const users = usersData.map((u) => ({
    ...u,
    createdAt: u.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  const courses = coursesData.map((c) => ({
    ...c,
    createdAt: c.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: c.updatedAt?.toISOString() ?? new Date().toISOString(),
    modules: (c.modules || []).map((m: any) => ({
      ...m,
      createdAt: m.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: m.updatedAt?.toISOString() ?? new Date().toISOString(),
      lessons: (m.lessons || []).map((l: any) => ({
        ...l,
        createdAt: l.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: l.updatedAt?.toISOString() ?? new Date().toISOString(),
      })),
    })),
    enrollments: (c.enrollments || []).map((e: any) => ({
      ...e,
      enrolledAt: e.enrolledAt?.toISOString() ?? new Date().toISOString(),
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
      institutionId={userInstitutionId}
    />
  );
}