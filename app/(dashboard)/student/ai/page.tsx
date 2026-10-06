import { requireAuth } from '@/lib/auth';
import { AIChat } from '@/components/ai/AIChat';
import { redirect } from 'next/navigation';

export default async function StudentAIPage() {
  const { user } = await requireAuth(['STUDENT']);

  if (!user.universityId || !user.programmeId || !user.year) {
    redirect('/onboarding');
  }

  return (
    <div className="space-y-6">
      <AIChat />
    </div>
  );
}
