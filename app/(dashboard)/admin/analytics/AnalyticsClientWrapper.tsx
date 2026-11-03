'use client';

import dynamic from 'next/dynamic';

// Dynamically import the analytics charts to avoid loading ~300KB recharts bundle on other pages
const AnalyticsCharts = dynamic(() => import('./AnalyticsCharts'), {
  ssr: false,
  loading: () => (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-muted-foreground text-sm">
          Platform statistics and user activity overview
        </p>
      </div>
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    </div>
  ),
});

export default function AnalyticsClientWrapper() {
  return <AnalyticsCharts />;
}
