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
  // 1. Authenticate with Clerk
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // 2. Fetch Clerk user with error handling
  let clerkUser;
  try {
    clerkUser = await currentUser();
  } catch (error) {
    console.error('Failed to fetch Clerk user:', error);
    // Fallback: redirect to sign-in or show error page
    redirect('/sign-in');
  }
  if (!clerkUser) redirect('/sign-in');

  // 3. Get user role from database
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });
  if (!dbUser || dbUser.role !== 'STUDENT') {
    redirect('/admin');
  }

  // 4. Parse search query
  const params = await searchParams;
  const searchQuery = params?.search || '';

  // 5. Fetch data in parallel
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

  // 6. Serialize dates
  const announcements = announcementsData.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  const videos = videosData.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }));

  // 7. Build display name
  const displayName =
    clerkUser.firstName ||
    clerkUser.fullName ||
    clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    'Student';

  // 8. Render content (layout is provided by parent layout.tsx)
  return (
    <StudentContent
      announcements={announcements}
      videos={videos}
      displayName={displayName}
      searchQuery={searchQuery}
    />
  );
}