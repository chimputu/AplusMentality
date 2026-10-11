import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';
import { withRetry } from './retry';

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
    console.error('[requireAuth] Failed to find user:', err.message);
    redirect('/unauthorized');
  }

  if (user) {
    const role = user.role;
    if (allowedRoles && !allowedRoles.includes(role)) {
      redirect('/unauthorized');
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
      console.error('[requireAuth] Failed to find user by email:', err.message);
      redirect('/unauthorized');
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
        console.error('[requireAuth] Failed to update user:', err.message);
        redirect('/unauthorized');
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
            redirect('/unauthorized');
          }
        }
      }
      console.log('✅ New user created:', user.email);
    }
  } catch (error: any) {
    console.error('[requireAuth] Unexpected error:', error.message);
    redirect('/unauthorized');
  }

  if (!user) {
    console.error('❌ Could not find or create user for clerkId:', userId);
    redirect('/unauthorized');
  }

  const role = user.role;

  if (allowedRoles && !allowedRoles.includes(role)) {
    redirect('/unauthorized');
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
    console.error('[getAuthUser] Failed to find user:', err.message);
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
      console.error('[getAuthUser] Failed to find user by email:', err.message);
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
        console.error('[getAuthUser] Failed to update user:', err.message);
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
        console.error('[getAuthUser] Failed to create user:', err.message);
        return null;
      }
    }
  } catch (error: any) {
    console.error('[getAuthUser] error:', error.message);
    return null;
  }

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return { userId, role: user.role, user };
}