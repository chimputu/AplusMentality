import { auth } from '@clerk/nextjs/server';
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

  // Get current user's institution for banner targeting
  const { userId } = await auth();
  let userInstitutionId: string | undefined;
  if (userId) {
    try {
      const user = await prisma.user.findUnique({ where: { clerkId: userId } });
      userInstitutionId = user?.institutionId || undefined;
    } catch (err) {
      console.error('[AdminPage] Failed to fetch user institution:', err);
    }
  }

  // ✅ Fetch each data source independently so one failure doesn't crash the whole page.
  // The prisma client already has built-in retry via $extends middleware, so no need
  // for additional withRetry wrappers that cause excessive delays.
  let announcementsData: any[] = [];
  let videosData: any[] = [];
  let usersData: any[] = [];
  let coursesData: any[] = [];

  // Fetch announcements
  try {
    announcementsData = await prisma.announcement.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } },
    });
  } catch (err) {
    console.error('[AdminPage] Failed to fetch announcements:', err);
  }

  // Fetch videos
  try {
    videosData = await prisma.video.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { uploader: { select: { name: true } } },
    });
  } catch (err) {
    console.error('[AdminPage] Failed to fetch videos:', err);
  }

  // Fetch users
  try {
    usersData = await prisma.user.findMany({
      take: 200,
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
    });
  } catch (err) {
    console.error('[AdminPage] Failed to fetch users:', err);
  }

  // Fetch courses (lightweight — no nested modules/lessons/enrollments on dashboard)
  try {
    coursesData = await prisma.course.findMany({
      take: 50,
      select: {
        id: true,
        title: true,
        code: true,
        description: true,
        thumbnail: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: { name: true } },
        _count: { select: { modules: true, enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('[AdminPage] Failed to fetch courses:', err);
  }

  // ✅ Serialize dates safely — ensure arrays are always arrays even if data is null/undefined
  const announcements = (Array.isArray(announcementsData) ? announcementsData : []).map((a) => ({
    ...a,
    createdAt: a.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  const videos = (Array.isArray(videosData) ? videosData : []).map((v) => ({
    ...v,
    createdAt: v.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  const users = (Array.isArray(usersData) ? usersData : []).map((u) => ({
    ...u,
    createdAt: u.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  const courses = (Array.isArray(coursesData) ? coursesData : []).map((c) => ({
    ...c,
    createdAt: c.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: c.updatedAt?.toISOString() ?? new Date().toISOString(),
    modules: (Array.isArray(c.modules) ? c.modules : []).map((m: any) => ({
      ...m,
      createdAt: m.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: m.updatedAt?.toISOString() ?? new Date().toISOString(),
      lessons: (Array.isArray(m.lessons) ? m.lessons : []).map((l: any) => ({
        ...l,
        createdAt: l.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: l.updatedAt?.toISOString() ?? new Date().toISOString(),
      })),
    })),
    enrollments: (Array.isArray(c.enrollments) ? c.enrollments : []).map((e: any) => ({
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