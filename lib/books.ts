// lib/books.ts

// ============================================
// Types
// ============================================

export interface BookResult {
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
  detailUrl: string;
}

// ============================================
// Project Gutenberg (gutendex.com)
// ============================================
// Gutenberg books are all public domain / legally free.
// Every result can be legally read + downloaded.

interface GutendexBook {
  id: number;
  title: string;
  authors: { name: string; birth_year?: number; death_year?: number }[];
  subjects: string[];
  languages: string[];
  formats: Record<string, string>;
  download_count: number;
}

interface GutendexResponse {
  count: number;
  results: GutendexBook[];
}

function gutenbergCoverUrl(id: number): string {
  return `https://www.gutenberg.org/cache/epub/${id}/pg${id}.cover.medium.jpg`;
}

function gutenbergBookFromApi(book: GutendexBook): BookResult {
  const formats = book.formats || {};
  const authors = book.authors?.map((a) => a.name).filter(Boolean) || [];

  // Pick the best legal download URLs from formats map
  const pdfUrl = formats['application/pdf'] || null;
  const epubUrl = formats['application/epub+zip'] || null;
  const htmlUrl = formats['text/html'] || null;
  const textUrl = formats['text/plain; charset=us-ascii'] || null;

  return {
    source: 'gutenberg',
    sourceId: String(book.id),
    title: book.title,
    authors: authors.join(', ') || 'Unknown',
    coverUrl: gutenbergCoverUrl(book.id),
    publishYear: null,
    description: null,
    subjects: book.subjects?.slice(0, 5).join(', ') || null,
    language: book.languages?.[0] || null,
    readUrl: htmlUrl || `https://www.gutenberg.org/ebooks/${book.id}`,
    downloadPdfUrl: pdfUrl,
    downloadEpubUrl: epubUrl,
    detailUrl: `https://www.gutenberg.org/ebooks/${book.id}`,
  };
}

export async function searchGutenberg(query: string, limit = 20): Promise<BookResult[]> {
  try {
    const url = new URL('https://gutendex.com/books');
    url.searchParams.set('search', query);

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // cache 1 hour
    });

    if (!res.ok) {
      console.warn('[books] Gutenberg request failed:', res.status);
      return [];
    }

    const data: GutendexResponse = await res.json();
    return (data.results || []).slice(0, limit).map(gutenbergBookFromApi);
  } catch (err) {
    console.error('[books] Gutenberg error:', err);
    return [];
  }
}

// ============================================
// Open Library (openlibrary.org)
// ============================================
// Open Library is metadata only — NOT a source of full-text PDFs.
// We only link to the detail page there. No download buttons.

interface OpenLibraryDoc {
  key: string;               // e.g. "/works/OL12345W"
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
  language?: string[];
  isbn?: string[];
}

interface OpenLibraryResponse {
  docs: OpenLibraryDoc[];
}

function openLibraryCoverUrl(coverId?: number): string | null {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}

function openLibraryBookFromApi(doc: OpenLibraryDoc): BookResult {
  const sourceId = doc.key.replace('/works/', '');
  const authors = doc.author_name?.slice(0, 3) || [];

  return {
    source: 'openlibrary',
    sourceId,
    title: doc.title,
    authors: authors.join(', ') || 'Unknown',
    coverUrl: openLibraryCoverUrl(doc.cover_i),
    publishYear: doc.first_publish_year || null,
    description: null,
    subjects: doc.subject?.slice(0, 5).join(', ') || null,
    language: doc.language?.[0] || null,
    readUrl: `https://openlibrary.org${doc.key}`,
    downloadPdfUrl: null,   // ← no legal direct download from here
    downloadEpubUrl: null,  // ← no legal direct download from here
    detailUrl: `https://openlibrary.org${doc.key}`,
  };
}

export async function searchOpenLibrary(query: string, limit = 20): Promise<BookResult[]> {
  try {
    const url = new URL('https://openlibrary.org/search.json');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn('[books] OpenLibrary request failed:', res.status);
      return [];
    }

    const data: OpenLibraryResponse = await res.json();
    return (data.docs || []).slice(0, limit).map(openLibraryBookFromApi);
  } catch (err) {
    console.error('[books] OpenLibrary error:', err);
    return [];
  }
}

// ============================================
// Combined search
// ============================================

export async function searchBooks(query: string, limit = 20): Promise<BookResult[]> {
  if (!query || query.trim().length < 2) return [];

  // Run both searches in parallel
  const [gutenberg, openLibrary] = await Promise.all([
    searchGutenberg(query, limit),
    searchOpenLibrary(query, limit),
  ]);

  // Merge, sort Gutenberg (freely downloadable) first
  const merged = [...gutenberg, ...openLibrary];

  // Dedupe by title + authors (case-insensitive)
  const seen = new Set<string>();
  const deduped: BookResult[] = [];
  for (const book of merged) {
    const key = `${book.title.toLowerCase().trim()}|${book.authors.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(book);
    }
  }

  return deduped.slice(0, limit);
}

// ============================================
// Fetch a single book by source + id
// ============================================

export async function fetchGutenbergBook(id: string): Promise<BookResult | null> {
  try {
    const res = await fetch(`https://gutendex.com/books/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data: GutendexBook = await res.json();
    return gutenbergBookFromApi(data);
  } catch (err) {
    console.error('[books] Gutenberg book fetch error:', err);
    return null;
  }
}

export async function fetchOpenLibraryBook(id: string): Promise<BookResult | null> {
  try {
    const res = await fetch(`https://openlibrary.org/works/${id}.json`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data: any = await res.json();

    const coverId =
      typeof data.covers?.[0] === 'number' ? data.covers[0] : undefined;

    // Fetch author name if available
    let authorName = 'Unknown';
    if (data.authors?.[0]?.author?.key) {
      try {
        const authorRes = await fetch(
          `https://openlibrary.org${data.authors[0].author.key}.json`,
          { next: { revalidate: 3600 } }
        );
        if (authorRes.ok) {
          const authorData = await authorRes.json();
          authorName = authorData.name || 'Unknown';
        }
      } catch {
        // Ignore — fallback to Unknown
      }
    }

    return {
      source: 'openlibrary',
      sourceId: id,
      title: data.title || 'Untitled',
      authors: authorName,
      coverUrl: openLibraryCoverUrl(coverId),
      publishYear:
        typeof data.first_publish_date === 'string'
          ? parseInt(data.first_publish_date.match(/\d{4}/)?.[0] || '', 10) || null
          : null,
      description:
        typeof data.description === 'string'
          ? data.description
          : data.description?.value || null,
      subjects: data.subjects?.slice(0, 5).join(', ') || null,
      language: null,
      readUrl: `https://openlibrary.org/works/${id}`,
      downloadPdfUrl: null,
      downloadEpubUrl: null,
      detailUrl: `https://openlibrary.org/works/${id}`,
    };
  } catch (err) {
    console.error('[books] OpenLibrary book fetch error:', err);
    return null;
  }
}

// ============================================
// Featured starter search (for empty state)
// ============================================

export const FEATURED_SEARCHES = [
  'computer science',
  'mathematics',
  'physics',
  'chemistry',
  'biology',
  'programming',
  'algorithms',
  'databases',
  'calculus',
  'english literature',
];