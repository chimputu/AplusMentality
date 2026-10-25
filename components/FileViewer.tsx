// components/FileViewer.tsx
'use client';

import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface FileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  title: string;
  fileType?: string | null;
  downloadUrl?: string;
}

/**
 * Wraps a PDF URL with Google Docs Viewer for reliable inline display.
 * Works across all browsers — Windows, Mac, Android, iOS.
 */
function getGoogleDocsViewerUrl(fileUrl: string): string {
  const encoded = encodeURIComponent(fileUrl);
  return `https://docs.google.com/viewer?url=${encoded}&embedded=true`;
}

export default function FileViewer({
  isOpen,
  onClose,
  fileUrl,
  title,
  fileType,
  downloadUrl,
}: FileViewerProps) {
  const [isIOS, setIsIOS] = useState(false);

  // Detect iOS once on mount
  useEffect(() => {
    const ios =
      typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIOS(ios);
  }, []);

  // Escape key + lock body scroll while open
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Android hardware back button closes the modal
  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ modal: true }, '');
    const handleBack = () => onClose();
    window.addEventListener('popstate', handleBack);
    return () => {
      window.removeEventListener('popstate', handleBack);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const ext = fileUrl.split('.').pop()?.toLowerCase().replace(/\?.*$/, '') || '';
  const isImage =
    fileType === 'image' ||
    IMAGE_EXTS.includes(fileType?.toLowerCase() || '') ||
    IMAGE_EXTS.includes(ext);
  const isPdf =
    fileType === 'pdf' ||
    fileType?.toLowerCase() === 'application/pdf' ||
    fileUrl.toLowerCase().endsWith('.pdf');
  const isDocx =
    fileType === 'docx' ||
    fileType?.toLowerCase() === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx' ||
    ext === 'doc';

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      style={{ height: '100dvh' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-background text-foreground flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <h3 className="font-medium text-sm truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {downloadUrl && (
            <a
              href={downloadUrl}
              download
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-foreground transition"
              aria-label="Download"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-card/10 hover:bg-card/20 text-foreground transition"
            aria-label="Open in new tab"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-card/10 hover:bg-card/20 text-foreground transition"
            aria-label="Close"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-background relative">
        {/* ============ IMAGE ============ */}
        {isImage && (
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={fileUrl}
              alt={title}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        )}

        {/* ============ PDF (via Google Docs Viewer) ============ */}
        {isPdf && !isImage && (
          <>
            <iframe
              src={getGoogleDocsViewerUrl(fileUrl)}
              title={title}
              className="w-full border-0"
              style={{ height: '100%', minHeight: '500px' }}
              allowFullScreen
            />

            {isIOS && (
              <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-3">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Having trouble viewing? Try these:
                </p>
                <div className="flex gap-2">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-foreground px-3 py-2 rounded-lg text-xs font-medium transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </a>
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      download
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-muted hover:bg-accent text-foreground px-3 py-2 rounded-lg text-xs font-medium transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ============ DOCX / OTHER ============ */}
        {!isImage && !isPdf && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-foreground font-semibold text-lg mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              {isDocx
                ? "Word documents can't be previewed in the browser. Download it to open in Word or Google Docs."
                : 'This file type cannot be previewed in the app.'}
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-foreground px-5 py-3 rounded-lg font-medium transition"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </a>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download
                  className="inline-flex items-center justify-center gap-2 bg-muted hover:bg-accent text-foreground px-5 py-3 rounded-lg font-medium transition"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}