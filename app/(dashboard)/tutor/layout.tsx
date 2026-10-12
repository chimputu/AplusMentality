// app/(dashboard)/tutor/layout.tsx
import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { AIAssistantWrapper } from '@/components/ai/ai-assistant-wrapper';

interface TutorLayoutProps {
  children: ReactNode;
}

export default async function TutorLayout({ children }: TutorLayoutProps) {
  const { role, user } = await requireAuth(['TUTOR']);
  const u = user!;

  // Handle missing institution gracefully
  const institutionName = u.institution?.shortName ?? u.institution?.name ?? null;

  return (
    <DashboardLayout role={role}>
      <div className="w-full">
        {children}
      </div>
      <AIAssistantWrapper
        userFirstName={u.firstName ?? null}
        userRole={u.role ?? null}
        userInstitution={institutionName}
      />
    </DashboardLayout>
  );
}
