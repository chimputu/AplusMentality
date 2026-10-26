import { Suspense } from 'react';
import SearchPageClient from './SearchPageClient';

export const dynamic = 'force-dynamic';

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <SearchPageClient />
    </Suspense>
  );
}
