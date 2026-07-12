import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    // ✅ Check if user exists
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // ✅ If not, try to create or find by email
    if (!user) {
      const { sessionClaims } = await auth();
      const claims = sessionClaims as any;
      const email = claims?.email || claims?.user?.email || claims?.emailAddress;
      
      if (email) {
        // ✅ Check by email
        user = await prisma.user.findUnique({
          where: { email },
        });
        
        if (user) {
          // ✅ Update clerkId
          user = await prisma.user.update({
            where: { email },
            data: { clerkId: userId },
          });
        }
      }
      
      // ✅ If still no user, create with unique email
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">A+Mentality</h1>
        <p className="text-xl text-gray-600 mb-8">
          Stay updated with the latest announcements from your mentors and community.
        </p>
        <div className="space-x-4">
          <Link
            href="/sign-in"
            className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}