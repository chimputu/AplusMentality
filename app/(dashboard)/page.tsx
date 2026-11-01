// Redirects authenticated users to their role-specific dashboard
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

// This page only redirects — skip static generation to avoid client reference manifest errors
export const dynamic = 'force-dynamic';

export default async function DashboardRootPage() {
  const { role } = await requireAuth();

  switch (role) {
    case 'TUTOR':
      redirect('/tutor');
    case 'STUDENT':
      redirect('/student');
    case 'ADMIN':
    case 'SUPER_ADMIN':
      redirect('/admin');
    default:
      redirect('/student');
  }
}
