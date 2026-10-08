import { requireAuth } from '@/lib/auth';
import { AIAssistant } from '@/components/ai/ai-assistant';
import { redirect } from 'next/navigation';

export default async function StudentAIPage() {
  const { user } = await requireAuth(['STUDENT']);

  if (!user.universityId || !user.programmeId || !user.year) {
    redirect('/onboarding');
  }

  return (
    <div className="space-y-6">
      <AIAssistant
        userFirstName={user.firstName ?? null}
        userRole={user.role ?? null}
        userInstitution={user.institution?.shortName ?? user.institution?.name ?? null}
      />
    </div>
  );
}
