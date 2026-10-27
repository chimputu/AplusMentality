import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

const ROLE_TO_DASHBOARD: Record<string, string> = {
  ADMIN: '/admin',
  'SUPER_ADMIN': '/admin',
  LECTURER: '/student',
  STUDENT: '/student',
  TUTOR: '/tutor',
};

export default async function NotFound() {
  let dashboardUrl = '/';

  try {
    const { userId } = await auth();
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { role: true },
      });
      if (user) {
        dashboardUrl = ROLE_TO_DASHBOARD[user.role] || '/';
      }
    }
  } catch {
    // Fall back to unauthenticated UI on DB error
  }

  const isAuthenticated = dashboardUrl !== '/';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="text-center max-w-md px-4 py-6">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isAuthenticated ? (
            <Link
              href={dashboardUrl}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 h-12 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 h-12 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Home
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 h-12 text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
