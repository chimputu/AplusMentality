import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/retry';
import { redirect } from 'next/navigation';
import HomePageClient from '@/components/HomePageClient';

// This page conditionally redirects authenticated users — skip static generation
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Home',
  description: 'A+ Mentality — your one-stop learning platform for Zambian universities. Access courses, quizzes, assignments, past papers, and connect with tutors.',
  openGraph: {
    title: 'A+ Mentality — Learning Platform for Zambian Universities',
    description: 'Access courses, quizzes, assignments, past papers, and connect with tutors.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: 'A+ Mentality',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'A+ Mentality — Learning Platform',
    description: 'Courses, quizzes, assignments, past papers, and tutor services.',
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
};

export default async function HomePage() {
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (err) {
    console.error('[HomePage] Clerk auth failed:', err);
    // userId remains null — render guest homepage
  }

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
      let sessionClaims: any = null;
      try {
        const authResult2 = await auth();
        sessionClaims = authResult2.sessionClaims;
      } catch (err) {
        console.error('[HomePage] Clerk session claims failed:', err);
      }
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
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      redirect('/admin');
    } else if (role === 'LECTURER') {
      redirect('/lecturer');
    } else if (role === 'TUTOR') {
      redirect('/tutor');
    } else {
      redirect('/student');
    }
  }

  return (
    <>
      {/* Structured data: WebSite with SearchAction */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'A+ Mentality',
            url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            description:
              'Learning Management System for Zambian universities — courses, quizzes, assignments, past papers, and tutor services.',
            potentialAction: {
              '@type': 'SearchAction',
              target: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      <HomePageClient />
    </>
  );
}