// components/FileViewer.tsx
'use client';

import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  title: string;
  fileType?: string | null;
  downloadUrl?: string;
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

  const isImage = fileType === 'image';

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      style={{ height: '100dvh' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-gray-900 text-white flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <h3 className="font-medium text-sm truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {downloadUrl && (
            <a
              href={downloadUrl}
              download
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
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
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Open in new tab"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Close"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-950 relative">
        {isImage ? (
          <img src={fileUrl} alt={title} className="w-full h-auto" />
        ) : (
          <>
            {/* PDF iframe — works on desktop + Android Chrome */}
            <iframe
              src={fileUrl}
              title={title}
              className="w-full border-0"
              style={{ height: '100%', minHeight: '500px' }}
            />

            {/* iOS Safari can't render PDFs inline — show fallback bar */}
            {isIOS && (
              <div className="absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-700 p-3">
                <p className="text-xs text-gray-400 text-center mb-2">
                  Having trouble viewing? Try these:
                </p>
                <div className="flex gap-2">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </a>
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      download
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition"
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
      </div>
    </div>
  );
}