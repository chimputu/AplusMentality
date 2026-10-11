'use client';

// Dashboard error boundary — catches errors within the (dashboard) route group
// Covers both /student/* and /admin/* routes
import { useEffect, useRef } from 'react';
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
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // Auto-retry after 2 seconds (matches observed transient failure recovery pattern)
  useEffect(() => {
    retryTimerRef.current = setTimeout(() => {
      unstable_retry();
    }, 2000);
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [unstable_retry]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <AlertTriangle className="h-16 w-16 text-amber-500" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        <p className="text-gray-600 max-w-md">
          We're reconnecting. This usually takes a couple of seconds.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            unstable_retry();
          }}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <RefreshCw className="h-4 w-4" /> Retry now
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
