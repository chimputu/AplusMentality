import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/retry';
import { redirect } from 'next/navigation';
import OnboardingForm from './_components/onboarding-form';

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  let user;
  try {
    user = await withRetry(
      () => prisma.user.findUnique({ where: { clerkId: userId } }),
      { attempts: 3, delayMs: 500 }
    );
  } catch (err: any) {
    console.error('[Onboarding] Failed to find user:', err.message);
    redirect('/login');
  }
  if (!user) {
    redirect('/login');
  }

  // If already onboarded, redirect to dashboard
  if (user.onboarded) {
    const role = user.role || 'STUDENT';
    redirect((role === 'ADMIN' || role === 'SUPER_ADMIN') ? '/admin' : '/student');
  }

  // Fetch data with error handling
  let institutions: any[] = [];
  let universities: any[] = [];

  try {
    [institutions, universities] = await withRetry(
      () => Promise.all([
        prisma.institution.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' },
          include: {
            programmes: {
              orderBy: { name: 'asc' },
              include: {
                faculty: true,
                branches: { orderBy: { name: 'asc' } },
              },
            },
            levels: { orderBy: { order: 'asc' } },
          },
        }),
        prisma.university.findMany({
          orderBy: { name: 'asc' },
          include: {
            programmes: {
              orderBy: { name: 'asc' },
              include: {
                faculty: true,
                branches: { orderBy: { name: 'asc' } },
              },
            },
          },
        }),
      ]),
      { attempts: 3, delayMs: 500 }
    );
  } catch (err: any) {
    console.error('[Onboarding] Failed to fetch data:', err.message);
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

        <OnboardingForm
          user={user}
          institutions={institutions}
          universities={universities}
        />
      </div>
    </div>
  );
}
