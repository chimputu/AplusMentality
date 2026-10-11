import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/retry';
import { redirect } from 'next/navigation';
import HomePageClient from '@/components/HomePageClient';

export default async function HomePage() {
  const { userId } = await auth();

  // Redirect logged-in users to their dashboard
  if (userId) {
    let user: any;
    try {
      user = await withRetry(
        () => prisma.user.findUnique({ where: { clerkId: userId } }),
        { attempts: 3, delayMs: 500 }
      );
    } catch (err: any) {
      console.error('[HomePage] Failed to find user:', err.message);
    }

    if (!user) {
      const { sessionClaims } = await auth();
      const claims = sessionClaims as any;
      const email = claims?.email || claims?.user?.email || claims?.emailAddress;
      if (email) {
        try {
          user = await withRetry(
            () => prisma.user.findUnique({ where: { email } }),
            { attempts: 3, delayMs: 500 }
          );
          if (user) {
            try {
              user = await withRetry(
                () => prisma.user.update({
                  where: { email },
                  data: { clerkId: userId },
                }),
                { attempts: 3, delayMs: 500 }
              );
            } catch (err: any) {
              console.error('[HomePage] Failed to update user clerkId:', err.message);
            }
          }
        } catch (err: any) {
          console.error('[HomePage] Failed to find user by email:', err.message);
        }
      }
      if (!user) {
        try {
          user = await withRetry(
            () => prisma.user.create({
              data: {
                clerkId: userId,
                email: email || `user_${Date.now()}@temp.com`,
                name: claims?.firstName ? `${claims.firstName} ${claims.lastName || ''}`.trim() : null,
                role: 'STUDENT',
              },
            }),
            { attempts: 3, delayMs: 500 }
          );
        } catch (error: any) {
          console.error('[HomePage] Could not create user:', error.message);
        }
      }
    }

    const role = user?.role || 'STUDENT';
    redirect((role === 'ADMIN' || role === 'SUPER_ADMIN') ? '/admin' : '/student');
  }

  return <HomePageClient />;
}