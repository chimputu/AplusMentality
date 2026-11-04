import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';
import { withRetry } from './retry';
import type { User } from '../generated/prisma/client';
import type { Role } from '../generated/prisma/enums';

/** User with institution relation included — matches the include shape in requireAuth/getAuthUser */
type UserWithInstitution = User & {
  institution: { shortName: string | null; name: string } | null;
};

/** Return type for authenticated page routes */
export interface AuthResult {
  userId: string;
  role: Role;
  user: UserWithInstitution;
}

/** Return type for API routes — nullable when unauthenticated */
export type ApiAuthResult = AuthResult | null;

// Role hierarchy from lowest to highest privilege
export const ROLE_HIERARCHY: Role[] = ['STUDENT', 'TUTOR', 'LECTURER', 'ADMIN', 'SUPER_ADMIN'];

/**
 * Enforce role hierarchy: a user can only modify users with strictly lower roles.
 * SUPER_ADMIN bypasses all checks.
 * Returns { allowed: true } or { allowed: false, reason: string }.
 */
export function checkRoleHierarchy(
  requesterRole: Role,
  targetRole: Role,
  newRole: Role
): { allowed: boolean; reason?: string } {
  // SUPER_ADMIN can do anything
  if (requesterRole === 'SUPER_ADMIN') return { allowed: true };

  const requesterIndex = ROLE_HIERARCHY.indexOf(requesterRole);
  const targetIndex = ROLE_HIERARCHY.indexOf(targetRole);
  const newIndex = ROLE_HIERARCHY.indexOf(newRole);

  // Cannot modify users with equal or higher role
  if (requesterIndex <= targetIndex) {
    return { allowed: false, reason: 'You cannot modify a user with equal or higher privileges.' };
  }

  // Cannot promote to a role equal to or higher than your own
  if (newIndex >= requesterIndex) {
    return { allowed: false, reason: 'You cannot promote a user to a role equal to or higher than your own.' };
  }

  return { allowed: true };
}

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
export async function requireAuth(allowedRoles?: string[]): Promise<AuthResult> {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let user: UserWithInstitution | null;
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[requireAuth] ❌ DB query failed for clerkId=%s: %s', userId, message);
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
export async function getAuthUser(allowedRoles?: string[]): Promise<ApiAuthResult> {
  const { userId } = await auth();
  if (!userId) return null;

  let user: UserWithInstitution | null;
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
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error('[getAuthUser] Failed to find user for clerkId=%s:', userId, {
      message: e.message,
      code: (err as { code?: string })?.code,
      meta: (err as { meta?: unknown })?.meta,
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