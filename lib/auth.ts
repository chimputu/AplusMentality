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

  if (user) {
    const role = user.role;
    if (allowedRoles && !allowedRoles.includes(role)) {
      console.warn('[requireAuth] ❌ Role mismatch: clerkId=%s has role=%s, required=%s', userId, role, allowedRoles.join(', '));
      // Redirect to the user's default dashboard based on their Prisma role
      const defaultDashboard = ROLE_TO_DEFAULT_DASHBOARD[role] || '/student';
      redirect(defaultDashboard);
    }
    return { userId, role, user };
  }

  const { sessionClaims } = await auth();
  const claims = sessionClaims as any;

  const email =
    claims?.email ||
    claims?.user?.email ||
    claims?.emailAddress ||
    `user_${Date.now()}@temp.com`;

  try {
    let existingUser: any;
    try {
      existingUser = await withRetry(
        () => prisma.user.findUnique({ where: { email } }),
        { attempts: 3, delayMs: 500 }
      );
    } catch (err: any) {
      console.error('[requireAuth] ❌ DB query by email failed for clerkId=%s: %s', userId, err.message);
      redirect('/unauthorized?reason=db_error');
    }

    if (existingUser) {
      try {
        user = await withRetry(
          () => prisma.user.update({
            where: { email },
            data: { clerkId: userId },
            include: { institution: { select: { shortName: true, name: true } } },
          }),
          { attempts: 3, delayMs: 500 }
        );
      } catch (err: any) {
        console.error('[requireAuth] ❌ Failed to update user email=%s: %s', email, err.message);
        redirect('/unauthorized?reason=db_error');
      }
      console.log('✅ User updated with clerkId:', user.email);
    } else {
      try {
        user = await withRetry(
          () => prisma.user.create({
            data: {
              clerkId: userId,
              email,
              name: claims?.firstName
                ? `${claims.firstName} ${claims.lastName || ''}`.trim()
                : null,
              role: 'STUDENT',
            },
            include: { institution: { select: { shortName: true, name: true } } },
          }),
          { attempts: 3, delayMs: 500 }
        );
      } catch (createError: any) {
        console.error('[requireAuth] Failed to create user:', createError.message);
        // Fallback: try with unique email
        try {
          const uniqueEmail = `user_${Date.now()}_${userId.slice(-6)}@temp.com`;
          user = await withRetry(
            () => prisma.user.create({
              data: {
                clerkId: userId,
                email: uniqueEmail,
                name: null,
                role: 'STUDENT',
              },
              include: { institution: { select: { shortName: true, name: true } } },
            }),
            { attempts: 3, delayMs: 500 }
          );
          console.log('✅ User created with unique email:', uniqueEmail);
        } catch (retryError: any) {
          console.error('[requireAuth] Fatal: Could not create user:', retryError.message);
          // Last resort: try to find by clerkId again
          try {
            user = await withRetry(
              () => prisma.user.findUnique({
                where: { clerkId: userId },
                include: { institution: { select: { shortName: true, name: true } } },
              }),
              { attempts: 2, delayMs: 300 }
            );
          } catch (finalErr: any) {
            console.error('[requireAuth] Final fallback failed:', finalErr.message);
          }
          if (!user) {
            console.error('[requireAuth] ❌ Could not create user for clerkId=%s after all retries', userId);
            redirect('/unauthorized?reason=user_not_found');
          }
        }
      }
      console.log('✅ New user created:', user.email);
    }
  } catch (error: any) {
    console.error('[requireAuth] ❌ Unexpected error for clerkId=%s: %s', userId, error.message);
    redirect('/unauthorized?reason=unexpected_error');
  }

  if (!user) {
    console.error('[requireAuth] ❌ Could not find or create user for clerkId=%s', userId);
    redirect('/unauthorized?reason=user_not_found');
  }

  const role = user.role;
  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn('[requireAuth] ❌ Role mismatch (after create): clerkId=%s has role=%s, required=%s', userId, role, allowedRoles.join(', '));
    const defaultDashboard = ROLE_TO_DEFAULT_DASHBOARD[role] || '/student';
    redirect(defaultDashboard);
  }

  return { userId, role, user };
}

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

  if (user) {
    if (allowedRoles && !allowedRoles.includes(user.role)) return null;
    return { userId, role: user.role, user };
  }

  const { sessionClaims } = await auth();
  const claims = sessionClaims as any;

  const email =
    claims?.email ||
    claims?.user?.email ||
    claims?.emailAddress ||
    `user_${Date.now()}@temp.com`;

  try {
    let existingUser: any;
    try {
      existingUser = await withRetry(
        () => prisma.user.findUnique({ where: { email } }),
        { attempts: 3, delayMs: 500 }
      );
    } catch (err: any) {
      console.error('[getAuthUser] Failed to find user by email for clerkId=%s:', userId, {
        message: err?.message,
        code: err?.code,
      });
      return null;
    }

    if (existingUser) {
      try {
        user = await withRetry(
          () => prisma.user.update({
            where: { email },
            data: { clerkId: userId },
            include: { institution: { select: { shortName: true, name: true } } },
          }),
          { attempts: 3, delayMs: 500 }
        );
      } catch (err: any) {
        console.error('[getAuthUser] Failed to update user for clerkId=%s:', userId, {
          message: err?.message,
          code: err?.code,
        });
        return null;
      }
    } else {
      try {
        user = await withRetry(
          () => prisma.user.create({
            data: {
              clerkId: userId,
              email,
              name: claims?.firstName
                ? `${claims.firstName} ${claims.lastName || ''}`.trim()
                : null,
              role: 'STUDENT',
            },
            include: { institution: { select: { shortName: true, name: true } } },
          }),
          { attempts: 3, delayMs: 500 }
        );
      } catch (err: any) {
        console.error('[getAuthUser] Failed to create user for clerkId=%s:', userId, {
          message: err?.message,
          code: err?.code,
        });
        return null;
      }
    }
  } catch (error: any) {
    console.error('[getAuthUser] Unexpected error for clerkId=%s:', userId, {
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n'),
    });
    return null;
  }

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return { userId, role: user.role, user };
}