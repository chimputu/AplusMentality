import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { AIAssistantWrapper } from '@/components/ai/ai-assistant-wrapper';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // ✅ Protect ALL admin routes
  const { role, user } = await requireAuth(['ADMIN', 'SUPER_ADMIN']);
  const u = user!;

  // Handle missing institution gracefully
  const institutionName = u.institution?.shortName ?? u.institution?.name ?? null;

  return (
    <DashboardLayout role={role}>
      <div className="w-full">
        {children}
      </div>
      {/* Wrap AIAssistant in error boundary to prevent crashes from affecting the admin dashboard */}
      <AIAssistantWrapper
        userFirstName={u.firstName ?? null}
        userRole={u.role ?? null}
        userInstitution={institutionName}
      />
    </DashboardLayout>
  );
}