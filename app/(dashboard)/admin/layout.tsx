import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { AIAssistantLazy } from '@/components/ai/ai-assistant-lazy';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // ✅ Protect ALL admin routes — requireAuth handles redirect on failure
  const { role, user } = await requireAuth(['ADMIN', 'SUPER_ADMIN']);
  const u = user!;

  // Handle missing institution gracefully
  const institutionName = u.institution?.shortName ?? u.institution?.name ?? null;

  return (
    <DashboardLayout role={role}>
      <div className="w-full">
        {children}
      </div>
      {/* AI assistant is dynamically loaded to avoid blocking initial page render (~500KB AI SDK) */}
      <AIAssistantLazy
        userFirstName={u.firstName ?? null}
        userRole={u.role ?? null}
        userInstitution={institutionName}
      />
    </DashboardLayout>
  );
}