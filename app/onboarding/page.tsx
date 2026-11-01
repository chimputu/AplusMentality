import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/retry';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import OnboardingForm from './_components/onboarding-form';

interface OnboardingPageProps {
  searchParams: Promise<{ slug?: string; type?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { userId } = await auth();
  if (!userId) {
    console.warn('[Onboarding] No userId, redirecting to sign-in');
    redirect('/sign-in');
  }

  let user;
  try {
    user = await withRetry(
      () => prisma.user.findUnique({ where: { clerkId: userId } }),
      { attempts: 3, delayMs: 500 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Onboarding] Failed to find user:', message);
    // Don't redirect to sign-in on DB error — show a fallback so the page isn't blank
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We couldn&apos;t load your profile. Please try signing in again.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Sign in again
          </Link>
        </div>
      </div>
    );
  }
  if (!user) {
    console.warn('[Onboarding] User not found in DB for clerkId=%s, redirecting to sign-in', userId);
    redirect('/sign-in');
  }

  // If already onboarded, redirect to dashboard
  if (user.onboarded) {
    const role = user.role || 'STUDENT';
    redirect((role === 'ADMIN' || role === 'SUPER_ADMIN') ? '/admin' : '/student');
  }

  // Read join link params from search params
  const params = await searchParams;
  const joinSlug = params.slug;
  const joinType = params.type;

  // If a join link is provided, fetch the locked institution details
  let lockedInstitutionId: string | undefined;
  let lockedInstitutionName: string | undefined;
  let lockedInstitutionDetails: {
    id: string;
    name: string;
    slug: string;
    levels: { id: string; name: string; order: number }[];
    periods: { id: string; name: string; order: number }[];
    hasBranches: boolean;
  } | undefined;

  if (joinSlug && joinType === 'institution') {
    try {
      const inst = await prisma.university.findUnique({
        where: { slug: joinSlug },
        include: {
          levels: { orderBy: { order: 'asc' } },
          periods: { orderBy: { order: 'asc' } },
        },
      });
      if (inst) {
        lockedInstitutionId = inst.id;
        lockedInstitutionName = inst.name;
        lockedInstitutionDetails = {
          id: inst.id,
          name: inst.name,
          slug: inst.slug,
          levels: inst.levels,
          periods: inst.periods,
          hasBranches: inst.hasBranches,
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Onboarding] Failed to fetch join link data:', message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome to A+ Mentality
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete your profile to get started. This only takes a minute.
          </p>
        </div>

        {lockedInstitutionName && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              🎓 Joining <strong>{lockedInstitutionName}</strong> via official link
            </p>
          </div>
        )}

        <OnboardingForm
          user={user}
          lockedInstitutionId={lockedInstitutionId}
          lockedInstitutionName={lockedInstitutionName}
          lockedInstitutionDetails={lockedInstitutionDetails}
        />
      </div>
    </div>
  );
}
