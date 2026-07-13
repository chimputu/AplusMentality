import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import HomePageClient from '@/components/HomePageClient';

export default async function HomePage() {
  const { userId } = await auth();

  // Redirect logged-in users to their dashboard
  if (userId) {
    let user = await prisma.user.findUnique({ where: { clerkId: userId } });

    if (!user) {
      const { sessionClaims } = await auth();
      const claims = sessionClaims as any;
      const email = claims?.email || claims?.user?.email || claims?.emailAddress;
      if (email) {
        user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          user = await prisma.user.update({
            where: { email },
            data: { clerkId: userId },
          });
        }
      }
      if (!user) {
        try {
          user = await prisma.user.create({
            data: {
              clerkId: userId,
              email: email || `user_${Date.now()}@temp.com`,
              name: claims?.firstName ? `${claims.firstName} ${claims.lastName || ''}`.trim() : null,
              role: 'STUDENT',
            },
          });
        } catch (error) {
          console.error('Could not create user:', error);
        }
      }
    }

    const role = user?.role || 'STUDENT';
    redirect(role === 'ADMIN' ? '/admin' : '/student');
  }

  return <HomePageClient />;
}