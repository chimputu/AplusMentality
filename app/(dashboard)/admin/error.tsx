'use client';

// Admin error boundary — catches errors within the /admin/* routes
// Provides recovery options specific to admin context with single auto-retry
import { useEffect, useRef, useState } from 'react';
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
  const [retried, setRetried] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    Sentry.captureException(error);
    console.error('[admin-error]', error);
  }, [error]);

  // Auto-retry ONCE after 3 seconds, then stop — prevents infinite toggle loop
  useEffect(() => {
    if (retried) return;
    retryTimerRef.current = setTimeout(() => {
      setRetried(true);
      unstable_retry();
    }, 3000);
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [unstable_retry, retried]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <AlertTriangle className="h-16 w-16 text-amber-500" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Loading admin dashboard</h1>
        <p className="text-gray-600 max-w-md">
          {retried
            ? 'Taking longer than expected. Please click Retry.'
            : 'Please wait a moment...'}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            setRetried(true);
            unstable_retry();
          }}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
        <button
          type="button"
          onClick={() => (window.location.href = '/admin')}
          className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-100 transition font-medium"
        >
          <Home className="h-4 w-4" /> Reload page
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-100 transition font-medium"
        >
          <Home className="h-4 w-4" /> Go home
        </Link>
      </div>
      {error.digest && (
        <p className="text-xs text-gray-400 font-mono mt-4">
          Reference: {error.digest}
        </p>
      )}
    </div>
  );
}
