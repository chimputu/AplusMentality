import { Loader2 } from 'lucide-react';

export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Loading your profile...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we prepare your onboarding.
        </p>
      </div>
    </div>
  );
}
