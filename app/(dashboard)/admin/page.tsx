import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import AdminContent from '@/components/AdminContent';
import { Suspense } from 'react';

interface SearchParams {
  tab?: string;
}

/**
 * Data-fetching component wrapped in Suspense so the page shell streams
 * immediately while Prisma queries resolve in the background.
 */
async function AdminDataContent({
  activeTab,
  userInstitutionId,
}: {
  activeTab: string;
  userInstitutionId: string | undefined;
}) {
  // ✅ Fetch each data source independently so one failure doesn't crash the whole page.
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

  // ✅ Serialize dates safely
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

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const activeTab = params?.tab || 'dashboard';

  // Get current user's institution for banner targeting (resolves quickly)
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

  // Stream the page shell immediately; data loads in Suspense boundary
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="w-full h-48 bg-gray-200 dark:bg-muted rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-muted rounded w-1/3 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <AdminDataContent activeTab={activeTab} userInstitutionId={userInstitutionId} />
    </Suspense>
  );
}