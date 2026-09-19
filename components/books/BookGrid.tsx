// components/books/BookGrid.tsx
'use client';

import { BookOpen } from 'lucide-react';
import BookCard, { type Book } from './BookCard';

interface BookGridProps {
  books: Book[];
  loading?: boolean;
  onSave?: (book: Book) => void;
  savedIds?: Set<string>;
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mt-3" />
      </div>
    </div>
  );
}

export default function BookGrid({
  books,
  loading,
  onSave,
  savedIds,
}: BookGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
          No books found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Try a different search term.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {books.map((book) => {
        const bookId = `${book.source}_${book.sourceId}`;
        return (
          <BookCard
            key={bookId}
            book={book}
            onSave={onSave}
            isSaved={savedIds?.has(bookId)}
          />
        );
      })}
    </div>
  );
}