'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              500
            </h1>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Something Went Wrong
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-mono break-all">
                Error: {error.digest}
              </p>
            )}
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
