'use client';

import { BookOpen, Download, ExternalLink, Info } from 'lucide-react';

interface LegalAccessLinksProps {
  readUrl: string | null;
  downloadPdfUrl: string | null;
  downloadEpubUrl: string | null;
  source: 'gutenberg' | 'openlibrary';
}

export default function LegalAccessLinks({
  readUrl,
  downloadPdfUrl,
  downloadEpubUrl,
  source,
}: LegalAccessLinksProps) {
  const hasDownload = !!(downloadPdfUrl || downloadEpubUrl);
  const isGutenberg = source === 'gutenberg';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-500" />
        Legal Access Options
      </h2>

      {/* Read online */}
      {readUrl && (
        <a
          href={readUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition mb-3 group"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-300 text-sm">
                Read online
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {isGutenberg
                  ? 'Read on Project Gutenberg'
                  : 'View on Open Library'}
              </p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition" />
        </a>
      )}

      {/* Download PDF */}
      {downloadPdfUrl && (
        <a
          href={downloadPdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="flex items-center justify-between w-full px-4 py-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg transition mb-3 group"
        >
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-300 text-sm">
                Download PDF
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Public domain
              </p>
            </div>
          </div>
          <Download className="w-4 h-4 text-green-600 dark:text-green-400 group-hover:translate-y-0.5 transition" />
        </a>
      )}

      {/* Download EPUB */}
      {downloadEpubUrl && (
        <a
          href={downloadEpubUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="flex items-center justify-between w-full px-4 py-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg transition mb-3 group"
        >
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-300 text-sm">
                Download EPUB
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                For e-readers
              </p>
            </div>
          </div>
          <Download className="w-4 h-4 text-green-600 dark:text-green-400 group-hover:translate-y-0.5 transition" />
        </a>
      )}

      {/* No legal download available */}
      {!hasDownload && (
        <div className="flex items-start gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg">
          <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Availability varies — view legal access options
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This book is only available for browsing. Full-text access may
              require purchase or a library membership.
            </p>
          </div>
        </div>
      )}

      {/* Footer note */}
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
        All resources shown here are from legitimate public-domain or openly
        licensed sources. A+ Mentality does not host or mirror copyrighted
        material.
      </p>
    </div>
  );
}