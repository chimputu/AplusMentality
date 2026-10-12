import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { AIAssistantWrapper } from '@/components/ai/ai-assistant-wrapper';
import { redirect } from 'next/navigation';

interface ExploreLayoutProps {
  children: ReactNode;
}

export default async function ExploreLayout({ children }: ExploreLayoutProps) {
  const { role, user } = await requireAuth(['STUDENT']);

  // Force onboarding if profile incomplete
  const hasInstitutionProfile = user.institutionId && user.programmeId && user.year;
  const hasUniversityProfile = user.universityId && user.programmeId && user.year;
  if (!hasInstitutionProfile && !hasUniversityProfile && !user.onboarded) {
    redirect('/onboarding');
  }

  return (
    <DashboardLayout role={role}>
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
