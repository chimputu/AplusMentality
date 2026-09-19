// components/books/BookDetails.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { BookOpen, User, Calendar, Languages, Tag } from 'lucide-react';
import LegalAccessLinks from './LegalAccessLinks';
import SaveBookButton from './SaveBookButton';

interface BookDetailsProps {
  book: {
    source: 'gutenberg' | 'openlibrary';
    sourceId: string;
    title: string;
    authors: string;
    coverUrl: string | null;
    publishYear: number | null;
    description: string | null;
    subjects: string | null;
    language: string | null;
    readUrl: string | null;
    downloadPdfUrl: string | null;
    downloadEpubUrl: string | null;
  };
}

export default function BookDetails({ book }: BookDetailsProps) {
  const [imageError, setImageError] = useState(false);

  // Split subjects into array for chips
  const subjectList = book.subjects
    ? book.subjects.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left — Cover */}
      <div className="md:col-span-1">
        <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 relative">
          {book.coverUrl && !imageError ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              onError={() => setImageError(true)}
              unoptimized
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-20 h-20 text-gray-300 dark:text-gray-600" />
            </div>
          )}
        </div>

        <div className="mt-4">
          <SaveBookButton book={book} />
        </div>
      </div>

      {/* Right — Details */}
      <div className="md:col-span-2 space-y-6">
        {/* Title & Author */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {book.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            {book.authors}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-3">
          {book.publishYear && (
            <span className="inline-flex items-center gap-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              {book.publishYear}
            </span>
          )}
          {book.language && (
            <span className="inline-flex items-center gap-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full">
              <Languages className="w-3.5 h-3.5" />
              {book.language.toUpperCase()}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full">
            {book.source === 'gutenberg' ? 'Project Gutenberg' : 'Open Library'}
          </span>
        </div>

        {/* Description */}
        {book.description && (
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              About this book
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {book.description}
            </p>
          </div>
        )}

        {/* Subjects */}
        {subjectList.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Subjects
            </h2>
            <div className="flex flex-wrap gap-2">
              {subjectList.map((s, i) => (
                <span
                  key={i}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Legal Access */}
        <LegalAccessLinks
          readUrl={book.readUrl}
          downloadPdfUrl={book.downloadPdfUrl}
          downloadEpubUrl={book.downloadEpubUrl}
          source={book.source}
        />
      </div>
    </div>
  );
}