// app/(dashboard)/student/layout.tsx
import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import { getActiveGlobalAnnouncement } from '@/lib/actions/banner';
import DashboardLayout from '@/components/DashboardLayout';
import { AIAssistantWrapper } from '@/components/ai/ai-assistant-wrapper';
import { redirect } from 'next/navigation';

interface StudentLayoutProps {
  children: ReactNode;
}

export default async function StudentLayout({ children }: StudentLayoutProps) {
  const { role, user } = await requireAuth(['STUDENT']);

  // Force onboarding if profile incomplete
  const hasInstitutionProfile = user.institutionId && user.programmeId && user.year;
  if (!hasInstitutionProfile && !user.onboarded) {
    redirect('/onboarding');
  }

  const announcement = await getActiveGlobalAnnouncement();

  return (
    <DashboardLayout role={role} announcement={announcement}>
      {children}
      {/* Wrap AIAssistant in error boundary to prevent crashes from affecting the dashboard */}
      <AIAssistantWrapper
        userFirstName={user.firstName ?? null}
        userRole={user.role ?? null}
        userInstitution={user.institution?.shortName ?? user.institution?.name ?? null}
      />
    </DashboardLayout>
  );
}