'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'download-banner-dismissed';

export default function DownloadBanner() {
  const [isAndroid, setIsAndroid] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Detect Android
    const ua = navigator.userAgent.toLowerCase();
    setIsAndroid(ua.includes('android'));

    // Check dismissal preference
    try {
      const stored = localStorage.getItem(DISMISS_KEY);
      if (stored === 'true') {
        setDismissed(true);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // localStorage not available
    }
  };

  if (!isAndroid || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-600 dark:bg-blue-700 text-white shadow-lg shadow-black/20">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">
            Get the A+ Mentality App for Android
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/download"
            className="inline-flex items-center gap-1.5 bg-white text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Download
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-blue-500/50 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
