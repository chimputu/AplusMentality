'use client';

// Global error boundary — handles errors in the root layout itself
// Must include <html> and <body> tags as it replaces the root layout
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center bg-gray-50">
          <AlertTriangle className="h-16 w-16 text-amber-500" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Application error</h1>
            <p className="text-gray-600 max-w-md">
              A critical error occurred. It has been reported and we're looking into it.
            </p>
          </div>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      </body>
    </html>
  );
}
