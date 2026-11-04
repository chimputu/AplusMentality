export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/retry';
import TutorApplicationWizard from './_components/tutor-application-wizard';

export default async function ApplyAsTutorPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  let user;
  try {
    user = await withRetry(
      () => prisma.user.findUnique({ where: { clerkId: userId! } }),
      { attempts: 3, delayMs: 500 }
    );
  } catch (err: any) {
    console.error('[ApplyAsTutor] Failed to find user:', err.message);
    redirect('/sign-in');
  }
  if (!user) redirect('/sign-in');
  const u = user;
  if (u.role !== 'STUDENT') redirect('/unauthorized');

  // Check if user is already a verified tutor
  if (u.isVerifiedTutor) {
    redirect('/student');
  }

  return (
    <div className="p-4 md:p-8">
      <TutorApplicationWizard />
    </div>
  );
}
