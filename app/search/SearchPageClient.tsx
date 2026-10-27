'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, BookOpen, FileText, Presentation, Video, Megaphone, ArrowRight, X } from 'lucide-react';

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length >= 2) {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data.results || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setResults([]);
    }
  }, [query]);

  const typeIcons: Record<string, any> = {
    course: <BookOpen className="w-5 h-5 text-blue-500" />,
    pastPaper: <FileText className="w-5 h-5 text-green-500" />,
    lectureSlide: <Presentation className="w-5 h-5 text-purple-500" />,
    video: <Video className="w-5 h-5 text-red-500" />,
    announcement: <Megaphone className="w-5 h-5 text-yellow-500" />,
  };

  const typeLabels: Record<string, string> = {
    course: 'Course',
    pastPaper: 'Past Paper',
    lectureSlide: 'Lecture Slide',
    video: 'Video',
    announcement: 'Announcement',
  };

  const handleClose = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition min-h-[48px] px-2 py-1"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Close</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100">
            Search A+ Mentality
          </h1>
          <div className="w-16" />
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, past papers, videos..."
            className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && results.length === 0 && query.length >= 2 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Results Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try searching with different keywords
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
            </p>
            {results.map((result, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 shrink-0">
                    {typeIcons[result.type] || <FileText className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {typeLabels[result.type] || result.type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {result.title || result.code || 'Untitled'}
                    </h3>
                    {result.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {result.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
