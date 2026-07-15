import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';

interface StudentLayoutProps {
  children: ReactNode;
}

export default async function StudentLayout({ children }: StudentLayoutProps) {
  // ✅ Protect ALL student routes
  const { role, user } = await requireAuth(['STUDENT']);

  return (
    <DashboardLayout role={role}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </DashboardLayout>
  );
}