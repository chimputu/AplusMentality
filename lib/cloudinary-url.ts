// lib/cloudinary-url.ts

/**
 * Converts a Cloudinary URL into an inline-viewable URL.
 * Removes the Content-Disposition: attachment header so browsers
 * (especially Windows Firefox/Edge/Chrome) render PDFs inline
 * instead of downloading them.
 *
 * Non-Cloudinary URLs are returned unchanged.
 */
export function getInlineUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;

  // Skip if already transformed
  if (url.includes('fl_attachment:false')) return url;

  return url.replace('/upload/', '/upload/fl_attachment:false/');
}

/**
 * Same as getInlineUrl but adds a page-number anchor for PDFs.
 * Useful when linking to a specific page.
 */
export function getInlineUrlWithPage(
  url: string | null | undefined,
  page: number
): string {
  const base = getInlineUrl(url);
  if (!base) return '';
  return `${base}#page=${page}`;
}