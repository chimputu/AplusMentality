import { requireAuth } from '@/lib/auth';
import { AIInsightsCard } from '@/components/ai/AIInsightsCard';
import { redirect } from 'next/navigation';
import { Lightbulb } from 'lucide-react';

export default async function StudentAIInsightsPage() {
  const { user } = await requireAuth(['STUDENT']);

  if (!user.universityId || !user.programmeId || !user.year) {
    redirect('/onboarding');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow">
          <Lightbulb className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Insights</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Personalized study recommendations based on your performance
          </p>
        </div>
      </div>

      {/* Insights Card */}
      <AIInsightsCard />
    </div>
  );
}
