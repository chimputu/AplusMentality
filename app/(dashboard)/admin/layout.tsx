import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { AIAssistant } from '@/components/ai/ai-assistant';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // ✅ Protect ALL admin routes
  const { role, user } = await requireAuth(['ADMIN', 'SUPER_ADMIN']);

  return (
    <DashboardLayout role={role}>
      <div className="w-full">
        {children}
      </div>
      <AIAssistant
        userFirstName={user.firstName ?? null}
        userRole={user.role ?? null}
        userInstitution={user.institution?.shortName ?? user.institution?.name ?? null}
      />
    </DashboardLayout>
  );
}