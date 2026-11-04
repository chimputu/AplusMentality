import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import NewCourseForm from './_components/new-course-form';

/**
 * Server component wrapper that enforces RBAC for course creation.
 * ADMIN users are locked to their own institution; SUPER_ADMIN can target any.
 */
export default async function NewCoursePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      institution: { select: { shortName: true, name: true } },
    },
  });

  if (!user) redirect('/onboarding');
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    redirect(user.role === 'STUDENT' ? '/student' : '/admin');
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  // ADMIN is locked to their institution; SUPER_ADMIN may override via search params
  const lockedInstitutionId = isSuperAdmin ? undefined : user.institutionId || undefined;
  const lockedInstitutionName = isSuperAdmin
    ? undefined
    : (user.institution?.shortName ?? user.institution?.name ?? null);

  return (
    <NewCourseForm
      isSuperAdmin={isSuperAdmin}
      lockedInstitutionId={lockedInstitutionId}
      lockedInstitutionName={lockedInstitutionName}
    />
  );
}
