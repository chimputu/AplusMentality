export const dynamic = 'force-dynamic';

import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import LecturerContent from '@/components/LecturerContent';

export default async function LecturerPage() {
  // 1. Authenticate with Clerk
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // 2. Fetch Clerk user
  let clerkUser;
  try {
    clerkUser = await currentUser();
  } catch (error) {
    console.error('Failed to fetch Clerk user:', error);
    redirect('/sign-in');
  }
  if (!clerkUser) redirect('/sign-in');

  // 3. Get user from database
  let dbUser: any;
  try {
    dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        role: true,
        institutionId: true,
        institution: { select: { shortName: true, name: true } },
      },
    });
  } catch (err: any) {
    console.error('[LecturerPage] Failed to fetch user:', err.message);
    redirect('/unauthorized');
  }
  if (!dbUser || dbUser.role !== 'LECTURER') {
    redirect('/unauthorized');
  }

  // 4. Fetch lecturer stats in parallel
  let stats: {
    courses: number;
    enrollments: number;
    assessments: number;
    submissions: number;
  } = { courses: 0, enrollments: 0, assessments: 0, submissions: 0 };

  try {
    const [coursesCount, enrollmentsCount, assessmentsCount, submissionsCount] =
      await Promise.all([
        prisma.course.count({ where: { createdBy: dbUser.id } }),
        prisma.enrollment.count({ where: { course: { createdBy: dbUser.id } } }),
        prisma.assessment.count({ where: { createdBy: dbUser.id } }),
        prisma.assessmentAttempt.count({
          where: { assessment: { createdBy: dbUser.id } },
        }),
      ]);

    stats = {
      courses: coursesCount,
      enrollments: enrollmentsCount,
      assessments: assessmentsCount,
      submissions: submissionsCount,
    };
  } catch (err: any) {
    console.error('[LecturerPage] Failed to fetch stats:', err.message);
  }

  // 5. Fetch recent activity (submissions and enrollments)
  let recentSubmissions: any[] = [];
  let recentEnrollments: any[] = [];

  try {
    [recentSubmissions, recentEnrollments] = await Promise.all([
      prisma.assessmentAttempt.findMany({
        where: { assessment: { createdBy: dbUser.id } },
        orderBy: { submittedAt: 'desc' },
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
          assessment: { select: { title: true } },
        },
      }),
      prisma.enrollment.findMany({
        where: { course: { createdBy: dbUser.id } },
        orderBy: { enrolledAt: 'desc' },
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true, code: true } },
        },
      }),
    ]);
  } catch (err: any) {
    console.error('[LecturerPage] Failed to fetch recent activity:', err.message);
  }

  // 6. Serialize dates
  const submissions = recentSubmissions.map((s) => ({
    ...s,
    submittedAt: s.submittedAt?.toISOString() ?? new Date().toISOString(),
    user: s.user,
    assessment: s.assessment,
  }));

  const enrollments = recentEnrollments.map((e) => ({
    ...e,
    enrolledAt: e.enrolledAt?.toISOString() ?? new Date().toISOString(),
    user: e.user,
    course: e.course,
  }));

  // 7. Build display name
  const displayName =
    clerkUser.firstName ||
    clerkUser.fullName ||
    clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    'Lecturer';

  // 8. Render content
  return (
    <LecturerContent
      displayName={displayName}
      stats={stats}
      submissions={submissions}
      enrollments={enrollments}
      institutionName={dbUser.institution?.shortName || dbUser.institution?.name || null}
    />
  );
}
