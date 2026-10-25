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
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-muted " />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted  rounded w-3/4" />
        <div className="h-3 bg-muted  rounded w-1/2" />
        <div className="h-8 bg-muted  rounded mt-3" />
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
      <div className="text-center py-16 bg-card rounded-xl border border-border">
        <BookOpen className="w-16 h-16 text-foreground dark:text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold text-foreground">
          No books found
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
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