import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          403
        </h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Access Denied
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
          You don't have permission to access this page. Please contact an administrator if you believe this is an error.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
