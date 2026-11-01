import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { buildCourseResourceScopeWhere } from '@/lib/auth/scope';
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
    redirect('/sign-in');
  }
  if (!clerkUser) redirect('/sign-in');

  // 3. Get user role and academic profile from database
  let dbUser: any;
  try {
    dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        role: true,
        institutionId: true,
        programmeId: true,
        year: true,
        period: true,
        institution: { select: { name: true } },
        programme: { select: { name: true, shortName: true } },
      },
    });
  } catch (err: any) {
    console.error('[StudentPage] Failed to fetch user:', err.message);
    redirect('/unauthorized');
  }
  if (!dbUser || dbUser.role !== 'STUDENT') {
    if (dbUser?.role === 'LECTURER') {
      redirect('/lecturer');
    } else if (dbUser?.role === 'TUTOR') {
      redirect('/tutor');
    } else if (dbUser?.role === 'ADMIN' || dbUser?.role === 'SUPER_ADMIN') {
      redirect('/admin');
    } else {
      redirect('/unauthorized');
    }
  }

  // 4. Parse search query
  const params = await searchParams;
  const searchQuery = params?.search || '';

  // 5. Fetch data in parallel (prisma client has built-in retry)
  // SECURITY: Scope videos to the user's university
  const resourceScope = buildCourseResourceScopeWhere({
    userId: dbUser.id || '',
    role: 'STUDENT',
    institutionId: dbUser.institutionId,
    year: dbUser.year,
    period: dbUser.period,
    mode: 'OWN',
    readOnly: false,
  });

  let announcementsData: any[] = [];
  let videosData: any[] = [];
  try {
    [announcementsData, videosData] = await Promise.all([
      prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true } } },
      }),
      prisma.video.findMany({
        where: resourceScope,
        orderBy: { createdAt: 'desc' },
        include: { uploader: { select: { name: true } } },
      }),
    ]);
  } catch (err: any) {
    console.error('[StudentPage] Failed to fetch announcements/videos:', err.message);
  }

  // 6. Serialize dates — ensure arrays are always arrays
  const announcements = (Array.isArray(announcementsData) ? announcementsData : []).map((a) => ({
    ...a,
    createdAt: a.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  const videos = (Array.isArray(videosData) ? videosData : []).map((v) => ({
    ...v,
    createdAt: v.createdAt?.toISOString() ?? new Date().toISOString(),
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
      institutionId={dbUser.institutionId || undefined}
      universityName={dbUser.institution?.name || null}
      universityCode={null}
      programmeName={dbUser.programme?.shortName || dbUser.programme?.name || null}
      year={dbUser.year || null}
    />
  );
}