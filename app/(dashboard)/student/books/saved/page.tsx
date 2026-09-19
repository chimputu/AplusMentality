// app/(dashboard)/student/books/saved/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowLeft, Search, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface SavedBook {
  savedId: string;
  savedAt: string;
  id: string;
  source: 'gutenberg' | 'openlibrary';
  sourceId: string;
  title: string;
  authors: string;
  coverUrl: string | null;
  publishYear: number | null;
  subjects: string | null;
  readUrl: string | null;
  downloadPdfUrl: string | null;
  downloadEpubUrl: string | null;
}

export default function SavedBooksPage() {
  const [books, setBooks] = useState<SavedBook[]>([]);
  const [filtered, setFiltered] = useState<SavedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/books/saved');
      if (!res.ok) {
        if (res.status === 401) {
          setError('Please sign in to view your library');
        } else {
          setError('Failed to load your library');
        }
        return;
      }
      const data = await res.json();
      setBooks(data.books || []);
      setFiltered(data.books || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load your library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Filter by search
  useEffect(() => {
    if (!search) {
      setFiltered(books);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.authors.toLowerCase().includes(q) ||
          (b.subjects || '').toLowerCase().includes(q)
      )
    );
  }, [search, books]);

  const handleRemove = async (book: SavedBook) => {
    if (!confirm(`Remove "${book.title}" from your library?`)) return;

    setRemoving(book.id);
    try {
      const res = await fetch(`/api/books/saved/${book.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove');
      }

      setBooks((prev) => prev.filter((b) => b.id !== book.id));
      setFiltered((prev) => prev.filter((b) => b.id !== book.id));
    } catch (err: any) {
      alert(err.message || 'Failed to remove book');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-xl"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto text-center py-16">
        <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {error}
        </h2>
        <Link
          href="/student/books"
          className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/student/books"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            My Library
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {books.length} saved book{books.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search filter */}
      {books.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter your saved books..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      )}

      {/* Empty state */}
      {books.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
            No saved books yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Search the library and save resources you want to revisit.
          </p>
          <Link
            href="/student/books"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition"
          >
            <Search className="w-4 h-4" />
            Browse Books
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            No books match &quot;{search}&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((book) => {
            const detailUrl = `/student/books/${book.sourceId}?source=${book.source}`;
            return (
              <div
                key={book.savedId}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
              >
                {/* Cover */}
                <Link
                  href={detailUrl}
                  className="block relative aspect-[3/4] bg-gray-100 dark:bg-gray-900 overflow-hidden"
                >
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="p-3 flex flex-col flex-1">
                  <Link href={detailUrl} className="block flex-1">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {book.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                      {book.authors}
                    </p>
                  </Link>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <Link
                      href={detailUrl}
                      className="flex-1 text-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg py-1.5 text-xs font-medium transition"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleRemove(book)}
                      disabled={removing === book.id}
                      className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition disabled:opacity-50"
                      aria-label="Remove from library"
                      title="Remove from library"
                    >
                      {removing === book.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}