// app/(dashboard)/tutor/layout.tsx
import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import { getActiveGlobalAnnouncement } from '@/lib/actions/banner';
import DashboardLayout from '@/components/DashboardLayout';
import { AIAssistantWrapper } from '@/components/ai/ai-assistant-wrapper';

interface TutorLayoutProps {
  children: ReactNode;
}

export default async function TutorLayout({ children }: TutorLayoutProps) {
  const { role, user } = await requireAuth(['TUTOR', 'LECTURER']);
  const u = user!;

  // Handle missing institution gracefully
  const institutionName = u.institution?.shortName ?? u.institution?.name ?? null;

  const announcement = await getActiveGlobalAnnouncement();

  return (
    <DashboardLayout role={role} announcement={announcement}>
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
