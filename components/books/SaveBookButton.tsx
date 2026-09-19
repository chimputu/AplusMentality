// components/books/SaveBookButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { BookMarked, BookmarkCheck, Loader2 } from 'lucide-react';

interface BookData {
  source: 'gutenberg' | 'openlibrary';
  sourceId: string;
  title: string;
  authors: string;
  coverUrl: string | null;
  publishYear: number | null;
  description?: string | null;
  subjects?: string | null;
  language?: string | null;
  readUrl?: string | null;
  downloadPdfUrl?: string | null;
  downloadEpubUrl?: string | null;
}

interface SaveBookButtonProps {
  book: BookData;
  initialSaved?: boolean;
}

export default function SaveBookButton({
  book,
  initialSaved = false,
}: SaveBookButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [bookDbId, setBookDbId] = useState<string | null>(null);

  // Check if already saved (belt and suspenders)
  useEffect(() => {
    if (initialSaved) return;
    fetch('/api/books/saved')
      .then((r) => (r.ok ? r.json() : { books: [] }))
      .then((data) => {
        const found = (data.books || []).find(
          (b: any) => b.source === book.source && b.sourceId === book.sourceId
        );
        if (found) {
          setSaved(true);
          setBookDbId(found.id);
        }
      })
      .catch(() => {});
  }, [book.source, book.sourceId, initialSaved]);

  const handleSave = async () => {
    if (saved) return; // already saved

    setLoading(true);
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

      const data = await res.json();
      setSaved(true);
      setBookDbId(data.book?.id || null);
    } catch (err: any) {
      alert(err.message || 'Failed to save book');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!bookDbId) {
      // Fallback: try to find and remove
      setSaved(false);
      return;
    }

    if (!confirm('Remove this book from your library?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/books/saved/${bookDbId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove');
      }

      setSaved(false);
      setBookDbId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to remove book');
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <button
        onClick={handleRemove}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-400 px-5 py-2.5 rounded-lg font-medium text-sm transition disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <BookmarkCheck className="w-4 h-4" />
        )}
        In Your Library
      </button>
    );
  }

  return (
    <button
      onClick={handleSave}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <BookMarked className="w-4 h-4" />
      )}
      Save to Library
    </button>
  );
}