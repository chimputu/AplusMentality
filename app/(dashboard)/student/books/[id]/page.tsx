// app/(dashboard)/student/books/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  fetchGutenbergBook,
  fetchOpenLibraryBook,
} from '@/lib/books';
import BookDetails from '@/components/books/BookDetails';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string }>;
}

export default async function BookDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { source } = await searchParams;

  if (!source || !['gutenberg', 'openlibrary'].includes(source)) {
    notFound();
  }

  let book = null;

  if (source === 'gutenberg') {
    book = await fetchGutenbergBook(id);
  } else if (source === 'openlibrary') {
    book = await fetchOpenLibraryBook(id);
  }

  if (!book) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/student/books"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </Link>

      <BookDetails book={book} />
    </div>
  );
}