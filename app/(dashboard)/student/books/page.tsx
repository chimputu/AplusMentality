// app/(dashboard)/student/books/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, BookMarked, Sparkles } from 'lucide-react';
import BookSearchBar from '@/components/books/BookSearchBar';
import BookGrid from '@/components/books/BookGrid';
import { type Book } from '@/components/books/BookCard';

const FEATURED = [
  'computer science',
  'mathematics',
  'physics',
  'chemistry',
  'biology',
  'programming',
  'algorithms',
  'calculus',
  'english literature',
];

export default function StudentBooksPage() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Load user's saved book IDs (so we can show "Saved" badge)
  useEffect(() => {
    fetch('/api/books/saved')
      .then((r) => (r.ok ? r.json() : { books: [] }))
      .then((data) => {
        const ids = new Set<string>(
          (data.books || []).map(
            (b: any) => `${b.source}_${b.sourceId}`
          )
        );
        setSavedIds(ids);
      })
      .catch(() => {});
  }, []);

  // Search whenever query changes
  useEffect(() => {
    if (query.length < 2) {
      setBooks([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/books/search?q=${encodeURIComponent(query)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Search failed');
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setBooks(data.results || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError('Could not load books. Please try again.');
          console.error(err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleSave = useCallback(async (book: Book) => {
    try {
      const res = await fetch('/api/books/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      setSavedIds((prev) => {
        const next = new Set(prev);
        next.add(`${book.source}_${book.sourceId}`);
        return next;
      });
    } catch (err: any) {
      alert(err.message || 'Failed to save book');
    }
  }, []);

  const showFeatured = query.length < 2;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Book Library
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Free educational books from Project Gutenberg and Open Library.
          </p>
        </div>
        <Link
          href="/student/books/saved"
          className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <BookMarked className="w-4 h-4" />
          My Library
        </Link>
      </div>

      {/* Search */}
      <BookSearchBar value={query} onChange={setQuery} />

      {/* Content */}
      {showFeatured ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Featured Subjects
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {FEATURED.map((topic) => (
              <button
                key={topic}
                onClick={() => setQuery(topic)}
                className="px-3 py-1.5 text-sm rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 transition"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <>
          {!loading && books.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Found {books.length} book{books.length !== 1 ? 's' : ''}
            </p>
          )}
          <BookGrid
            books={books}
            loading={loading}
            onSave={handleSave}
            savedIds={savedIds}
          />
        </>
      )}
    </div>
  );
}