import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // ✅ Protect ALL admin routes
  const { role, user } = await requireAuth(['ADMIN']);

  return (
    <DashboardLayout role={role}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </DashboardLayout>
  );
}