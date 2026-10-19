import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

// This route handles /dashboard — a common URL that may be prefetched or linked.
// It redirects to the appropriate dashboard based on the user's role.
export default async function DashboardRedirect() {
  const { userId, orgRole } = await auth();

  if (!userId) redirect('/login');

  // Admins go to the admin dashboard
  if (orgRole === 'org:admin') redirect('/admin');

  // Check database role for more precise routing
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });
    if (user?.role === 'TUTOR') redirect('/tutor');
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') redirect('/admin');
  } catch {
    // Fallback to student if DB query fails
  }

  // Everyone else goes to the student dashboard
  redirect('/student');
}
