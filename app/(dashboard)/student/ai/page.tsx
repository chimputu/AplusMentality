export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth';
import { AIAssistantPage } from '@/components/ai/ai-assistant-page';
import { redirect } from 'next/navigation';

export default async function StudentAIPage() {
  const { user } = await requireAuth(['STUDENT']);

  if (!user.institutionId || !user.programmeId || !user.year) {
    redirect('/onboarding');
  }

  return (
    <AIAssistantPage
      userFirstName={user.firstName ?? null}
      userRole={user.role ?? null}
      userInstitution={user.institution?.shortName ?? user.institution?.name ?? null}
    />
  );
}
