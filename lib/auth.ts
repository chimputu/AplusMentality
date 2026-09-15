import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';

export async function requireAuth(allowedRoles?: string[]) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

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
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      user = await prisma.user.update({
        where: { email },
        data: { clerkId: userId },
      });
      console.log('✅ User updated with clerkId:', user.email);
    } else {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email,
          name: claims?.firstName
            ? `${claims.firstName} ${claims.lastName || ''}`.trim()
            : null,
          role: 'STUDENT',
        },
      });
      console.log('✅ New user created:', user.email);
    }
  } catch (error) {
    console.error('Failed to create/update user:', error);

    try {
      const uniqueEmail = `user_${Date.now()}_${userId.slice(-6)}@temp.com`;
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: uniqueEmail,
          name: null,
          role: 'STUDENT',
        },
      });
      console.log('✅ User created with unique email:', uniqueEmail);
    } catch (retryError) {
      console.error('Fatal: Could not create user:', retryError);
      user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        redirect('/unauthorized');
      }
    }
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

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

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
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      user = await prisma.user.update({
        where: { email },
        data: { clerkId: userId },
      });
    } else {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email,
          name: claims?.firstName
            ? `${claims.firstName} ${claims.lastName || ''}`.trim()
            : null,
          role: 'STUDENT',
        },
      });
    }
  } catch (error) {
    console.error('getAuthUser error:', error);
    return null;
  }

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return { userId, role: user.role, user };
}