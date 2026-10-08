'use client';

// Admin error boundary — catches errors within the /admin/* routes
// Provides recovery options specific to admin context
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <AlertTriangle className="h-16 w-16 text-amber-500" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Admin page error</h1>
        <p className="text-gray-600 max-w-md">
          Something went wrong on this admin page. The error has been reported.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-100 transition font-medium"
        >
          <Home className="h-4 w-4" /> Back to admin
        </Link>
      </div>
    </div>
  );
}
