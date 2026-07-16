import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import StudentContent from '@/components/StudentContent';

interface SearchParams {
  search?: string;
}

export default async function StudentPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== 'STUDENT') {
    redirect('/admin');
  }

  const params = await searchParams;
  const searchQuery = params?.search || '';

  const [announcementsData, videosData] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } },
    }),
    prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      include: { uploader: { select: { name: true } } },
    }),
  ]);

  const announcements = announcementsData.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  const videos = videosData.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }));

  const displayName =
    clerkUser.firstName ||
    clerkUser.fullName ||
    clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    'Student';

  // ❌ Removed DashboardLayout — layout.tsx already provides it
  return (
    <StudentContent
      announcements={announcements}
      videos={videos}
      displayName={displayName}
      searchQuery={searchQuery}
    />
  );
}