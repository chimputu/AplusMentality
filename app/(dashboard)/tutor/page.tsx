import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import TutorContent from '@/components/TutorContent';

export default async function TutorPage() {
  // 1. Authenticate with Clerk
  const { userId } = await auth();
  if (!userId) redirect('/login');

  // 2. Fetch Clerk user
  let clerkUser;
  try {
    clerkUser = await currentUser();
  } catch (error) {
    console.error('Failed to fetch Clerk user:', error);
    redirect('/login');
  }
  if (!clerkUser) redirect('/login');

  // 3. Get user role from database
  let dbUser: any;
  try {
    dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        role: true,
        institutionId: true,
        universityId: true,
        programmeId: true,
        year: true,
        period: true,
        institution: { select: { shortName: true, name: true } },
        university: { select: { name: true, code: true } },
        programme: { select: { name: true, shortName: true } },
      },
    });
  } catch (err: any) {
    console.error('[TutorPage] Failed to fetch user:', err.message);
    redirect('/unauthorized');
  }
  if (!dbUser || dbUser.role !== 'TUTOR') {
    redirect('/unauthorized');
  }

  // 4. Fetch tutor profile and related data in parallel (prisma has built-in retry)
  let tutorProfile: any = null;
  let requests: any[] = [];
  let application: any = null;

  try {
    [tutorProfile, application] = await Promise.all([
      prisma.tutor.findFirst({
        where: { userId: dbUser.id },
        include: {
          specialties: {
            include: { course: true },
          },
        },
      }),
      prisma.tutorApplication.findUnique({
        where: { userId: dbUser.id },
        include: {
          references: true,
          offerings: {
            include: { course: true },
          },
        },
      }),
    ]);

    if (tutorProfile) {
      requests = await prisma.tutorRequest.findMany({
        where: { tutorId: tutorProfile.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    }
  } catch (err: any) {
    console.error('[TutorPage] Failed to fetch tutor data:', err.message);
  }

  // 5. Build display name
  const displayName =
    clerkUser.firstName ||
    clerkUser.fullName ||
    clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    'Tutor';

  // 6. Calculate stats
  const pendingRequests = requests.filter((r: any) => r.status === 'PENDING').length;
  const acceptedRequests = requests.filter((r: any) => r.status === 'ACCEPTED').length;
  const totalRequests = requests.length;
  const specialtyCount = tutorProfile?.specialties?.length || 0;

  const stats = {
    pendingRequests,
    acceptedRequests,
    totalRequests,
    specialtyCount,
    isVerified: tutorProfile?.isVerified || false,
    isActive: tutorProfile?.isActive || false,
    applicationStatus: application?.status || null,
  };

  // 7. Render content
  return (
    <TutorContent
      displayName={displayName}
      tutorProfile={tutorProfile}
      requests={requests}
      application={application}
      stats={stats}
      institutionId={dbUser.institutionId || undefined}
      institutionName={dbUser.institution?.shortName || dbUser.institution?.name || null}
    />
  );
}
