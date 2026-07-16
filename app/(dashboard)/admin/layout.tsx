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
      <div className="w-full">
        {children}
      </div>
    </DashboardLayout>
  );
}