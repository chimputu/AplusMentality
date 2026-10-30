'use client';

import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto mb-6 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-3">
          You&apos;re Offline
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-8 leading-relaxed">
          It looks like you&apos;ve lost your internet connection. Some features may not be
          available right now. You can still view previously loaded content.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 bg-muted hover:bg-accent text-foreground font-medium rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Tip */}
        <p className="text-xs text-muted-foreground mt-8">
          💡 Tip: Install the app for better offline support. Look for the install button in your
          browser&apos;s address bar.
        </p>
      </div>
    </div>
  );
}
