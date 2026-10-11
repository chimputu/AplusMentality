import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/retry';
import AdminContent from '@/components/AdminContent';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle } from 'lucide-react';

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

  // ✅ Fetch data with retry logic for transient failures
  let announcementsData: any[] = [];
  let videosData: any[] = [];
  let usersData: any[] = [];
  let coursesData: any[] = [];
  let fetchError: Error | null = null;

  try {
    [announcementsData, videosData, usersData, coursesData] = await withRetry(
      async () => {
        return await Promise.all([
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
              username: true,
              firstName: true,
              lastName: true,
              name: true,
              imageUrl: true,
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
      },
      {
        attempts: 3,
        delayMs: 500,
        backoff: 2,
        onRetry: (attempt, err) => {
          console.log(`Admin page data fetch retry ${attempt}:`, err.message);
        },
      }
    );
  } catch (err) {
    console.error('Failed to fetch admin data after retries:', err);
    Sentry.captureException(err);
    fetchError = err instanceof Error ? err : new Error(String(err));
  }

  // If all retries failed, show error state
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Couldn&apos;t load dashboard</h1>
        <p className="text-gray-600 mb-6 max-w-md">
          We&apos;re having trouble connecting to the database. Please try again in a moment.
        </p>
        <a
          href="/admin"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition"
        >
          Try again
        </a>
      </div>
    );
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