// Redirects authenticated users to their role-specific dashboard
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

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
