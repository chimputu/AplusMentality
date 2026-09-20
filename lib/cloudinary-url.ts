// lib/cloudinary-url.ts

/**
 * Returns a URL suitable for inline viewing of a file.
 *
 * NOTE: This function used to inject Cloudinary's `fl_attachment:false`
 * transformation flag, but that flag causes Firefox to download the file
 * with an incorrect filename (`false.pdf`) instead of previewing it.
 *
 * Instead, we now wrap PDFs in Google Docs Viewer (done in FileViewer.tsx),
 * which works reliably across all browsers and OS combinations.
 *
 * This function is now a passthrough but kept for backward compatibility
 * across all pages that import it.
 */
export function getInlineUrl(url: string | null | undefined): string {
  if (!url) return '';
  return url;
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