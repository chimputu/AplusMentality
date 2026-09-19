'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Download, ExternalLink, BookMarked } from 'lucide-react';
import { useState } from 'react';

export interface Book {
  source: 'gutenberg' | 'openlibrary';
  sourceId: string;
  title: string;
  authors: string;
  coverUrl: string | null;
  publishYear: number | null;
  subjects: string | null;
  downloadPdfUrl?: string | null;
  downloadEpubUrl?: string | null;
}

interface BookCardProps {
  book: Book;
  onSave?: (book: Book) => void;
  isSaved?: boolean;
}

export default function BookCard({ book, onSave, isSaved }: BookCardProps) {
  const [imageError, setImageError] = useState(false);
  const [saving, setSaving] = useState(false);

  const detailUrl = `/student/books/${book.sourceId}?source=${book.source}`;
  const hasFreeDownload = !!(book.downloadPdfUrl || book.downloadEpubUrl);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onSave || saving) return;
    setSaving(true);
    try {
      await onSave(book);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
      {/* Cover */}
      <Link href={detailUrl} className="block relative aspect-[3/4] bg-gray-100 dark:bg-gray-900 overflow-hidden">
        {book.coverUrl && !imageError ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {/* Free download badge */}
        {hasFreeDownload && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <Download className="w-3 h-3" />
            Free
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
          {book.publishYear && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              {book.publishYear}
            </p>
          )}
        </Link>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Link
            href={detailUrl}
            className="flex-1 text-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg py-1.5 text-xs font-medium transition"
          >
            View Details
          </Link>
          {onSave && (
            <button
              onClick={handleSave}
              disabled={saving || isSaved}
              className={`p-1.5 rounded-lg transition ${
                isSaved
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              } disabled:opacity-70`}
              aria-label={isSaved ? 'Saved' : 'Save to library'}
              title={isSaved ? 'In your library' : 'Save to library'}
            >
              <BookMarked className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}