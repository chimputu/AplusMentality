import Link from 'next/link';

interface UnauthorizedPageProps {
  searchParams: Promise<{ reason?: string; detail?: string }>;
}

export default async function UnauthorizedPage({ searchParams }: UnauthorizedPageProps) {
  const params = await searchParams;
  const reason = params.reason || '';
  const detail = params.detail || '';

  const titles: Record<string, string> = {
    db_error: 'Database Error',
    role_mismatch: 'Insufficient Permissions',
    user_not_found: 'Account Not Found',
    unexpected_error: 'Something Went Wrong',
  };

  const descriptions: Record<string, string> = {
    db_error: 'We could not connect to the database. Please try again later.',
    role_mismatch: detail || "You don't have the required role to access this page.",
    user_not_found: detail || 'Your account could not be found in our system. Please contact support.',
    unexpected_error: detail || 'An unexpected error occurred. Please try again.',
  };

  const title = titles[reason] || 'Access Denied';
  const description = descriptions[reason] || "You don't have permission to view this page.";

  const icons: Record<string, string> = {
    db_error: '🔌',
    role_mismatch: '🔒',
    user_not_found: '👤',
    unexpected_error: '⚠️',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md text-center shadow-lg">
        <div className="text-6xl mb-4">{icons[reason] || '🚫'}</div>
        <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">{title}</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-2">{description}</p>
        {reason === 'role_mismatch' && detail && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 italic">{detail}</p>
        )}
        {reason === 'db_error' && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Check the server logs for details, or contact your administrator.
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Go Home
          </Link>
          {reason === 'role_mismatch' && (
            <Link
              href="/student"
              className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try the student dashboard →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}