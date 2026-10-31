import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';
import { withRetry } from './retry';

// Map Prisma roles to default dashboard paths
const ROLE_TO_DEFAULT_DASHBOARD: Record<string, string> = {
  STUDENT: '/student',
  TUTOR: '/tutor',
  LECTURER: '/lecturer',
  ADMIN: '/admin',
  SUPER_ADMIN: '/admin',
};

/**
 * Require authentication for page routes. Uses redirects (safe for pages).
 * Does NOT create users — relies on the Clerk webhook to provision records.
 * If the user is not found in the database, redirects to onboarding.
 */
export async function requireAuth(allowedRoles?: string[]) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let user: any;
  try {
    user = await withRetry(
      () => prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
          institution: { select: { shortName: true, name: true } },
        },
      }),
      { attempts: 3, delayMs: 500 }
    );
  } catch (err: any) {
    console.error('[requireAuth] ❌ DB query failed for clerkId=%s: %s', userId, err.message);
    redirect('/unauthorized?reason=db_error');
  }

  // SECURITY: Do not create users as a side effect of authentication.
  // The Clerk webhook provisions user records idempotently.
  // If the user is not found, redirect to onboarding to trigger provisioning.
  if (!user) {
    console.warn('[requireAuth] User not found in DB for clerkId=%s, redirecting to onboarding', userId);
    redirect('/onboarding');
  }

  const role = user.role;
  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn('[requireAuth] ❌ Role mismatch: clerkId=%s has role=%s, required=%s', userId, role, allowedRoles.join(', '));
    const defaultDashboard = ROLE_TO_DEFAULT_DASHBOARD[role] || '/student';
    redirect(defaultDashboard);
  }

  return { userId, role, user };
}

/**
 * Get the authenticated user without redirects — safe for API routes.
 * Does NOT create users — relies on the Clerk webhook to provision records.
 * Returns null if not authenticated or user not found in DB.
 */
export async function getAuthUser(allowedRoles?: string[]) {
  const { userId } = await auth();
  if (!userId) return null;

  let user: any;
  try {
    user = await withRetry(
      () => prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
          institution: { select: { shortName: true, name: true } },
        },
      }),
      { attempts: 3, delayMs: 500 }
    );
  } catch (err: any) {
    console.error('[getAuthUser] Failed to find user for clerkId=%s:', userId, {
      message: err?.message,
      code: err?.code,
      meta: err?.meta,
    });
    return null;
  }

  // SECURITY: Do not create users as a side effect of authentication.
  // The Clerk webhook provisions user records idempotently.
  if (!user) {
    console.warn('[getAuthUser] User not found in DB for clerkId=%s', userId);
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) return null;
  return { userId, role: user.role, user };
}