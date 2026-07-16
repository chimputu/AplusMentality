// app/(dashboard)/student/layout.tsx
import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';

interface StudentLayoutProps {
  children: ReactNode;
}

export default async function StudentLayout({ children }: StudentLayoutProps) {
  const { role } = await requireAuth(['STUDENT']);

  return (
    <DashboardLayout role={role}>
      {children}
    </DashboardLayout>
  );
}