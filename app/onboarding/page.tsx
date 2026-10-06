import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import OnboardingForm from './_components/onboarding-form';

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    redirect('/sign-in');
  }

  // If already onboarded, redirect to dashboard
  if (user.onboarded) {
    const role = user.role || 'STUDENT';
    redirect((role === 'ADMIN' || role === 'SUPER_ADMIN') ? '/admin' : '/student');
  }

  // Fetch institutions for the dropdown
  const institutions = await prisma.institution.findMany({
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
  });

  // Also fetch legacy universities for backward compatibility
  const universities = await prisma.university.findMany({
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
  });

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
