'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Lightbulb, ArrowRight } from 'lucide-react';

interface Insight {
  type: 'warning' | 'success' | 'tip';
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export function AIInsightsCard() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchInsights() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/insights', { method: 'POST' });
      const data = await res.json();
      if (data.insights) {
        setInsights(data.insights);
      } else {
        setError(data.error || 'Failed to load insights');
      }
    } catch {
      setError('Failed to load insights');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInsights();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'tip':
        return <Lightbulb className="w-5 h-5 text-blue-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-l-amber-400';
      case 'success':
        return 'border-l-green-400';
      case 'tip':
        return 'border-l-blue-400';
      default:
        return 'border-l-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Insights</h3>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500"
          aria-label="Refresh insights"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading && insights.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse flex items-start gap-3 p-3 rounded-lg border-l-4 border-l-gray-300 bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))
        ) : error ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            {error}
          </p>
        ) : (
          insights.map((insight, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${getBorderColor(
                insight.type
              )} bg-gray-50 dark:bg-gray-700/50`}
            >
              <div className="mt-0.5 flex-shrink-0">{getIcon(insight.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {insight.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {insight.description}
                </p>
                {insight.action && (
                  <a
                    href={insight.action.href}
                    className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {insight.action.label}
                    <ArrowRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
