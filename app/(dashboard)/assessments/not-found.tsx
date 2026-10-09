import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">📝</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Assessment Not Found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          The assessment you're looking for doesn't exist or you don't have access.
        </p>
        <Link
          href="/student/assessments"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Assessments
        </Link>
      </div>
    </div>
  );
}
