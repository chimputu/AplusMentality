'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Error boundary to prevent banner crashes from breaking the page
class BannerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

interface Banner {
  id: string;
  title: string;
  message: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  imageUrl?: string | null;
  variant: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' | 'PROMO';
  placement: string;
  priority: number;
}

const variantStyles: Record<string, { bg: string; border: string; text: string; cta: string }> = {
  INFO: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-l-blue-500',
    text: 'text-blue-800 dark:text-blue-200',
    cta: 'bg-blue-600 hover:bg-blue-700 text-foreground',
  },
  SUCCESS: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-l-green-500',
    text: 'text-green-800 dark:text-green-200',
    cta: 'bg-green-600 hover:bg-green-700 text-foreground',
  },
  WARNING: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-l-amber-500',
    text: 'text-amber-800 dark:text-amber-200',
    cta: 'bg-amber-600 hover:bg-amber-700 text-foreground',
  },
  DANGER: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-l-red-500',
    text: 'text-red-800 dark:text-red-200',
    cta: 'bg-red-600 hover:bg-red-700 text-foreground',
  },
  PROMO: {
    bg: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30',
    border: 'border-l-purple-500',
    text: 'text-purple-800 dark:text-purple-200',
    cta: 'bg-purple-600 hover:bg-purple-700 text-foreground',
  },
};

export default function BannerCarousel({
  placement,
  institutionId,
}: {
  placement: 'HOMEPAGE' | 'DASHBOARD';
  institutionId?: string;
}) {
  return (
    <BannerErrorBoundary>
      <BannerCarouselInner placement={placement} institutionId={institutionId} />
    </BannerErrorBoundary>
  );
}

function BannerCarouselInner({
  placement,
  institutionId,
}: {
  placement: 'HOMEPAGE' | 'DASHBOARD';
  institutionId?: string;
}) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('dismissed_banners');
        return stored ? new Set(JSON.parse(stored)) : new Set();
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  const fetchBanners = useCallback(async () => {
    try {
      let url = `/api/banners/active?placement=${placement}`;
      if (institutionId) {
        url += `&institutionId=${institutionId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const bannerCount = (data.banners || []).length;
        console.log(`[banner-carousel] Fetched ${bannerCount} banner(s) for placement=${placement} institution=${institutionId ?? 'none'}`);
        setBanners(data.banners || []);
      } else {
        console.error(`[banner-carousel] API returned ${res.status} for placement=${placement}`);
      }
    } catch (error) {
      console.error('[banner-carousel] Failed to fetch banners:', error);
    }
  }, [placement, institutionId]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const dismissBanner = (id: string) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(id);
    setDismissed(newDismissed);
    try {
      localStorage.setItem('dismissed_banners', JSON.stringify([...newDismissed]));
    } catch {
      // Ignore storage errors
    }
  };

  const visibleBanners = banners.filter((b) => !dismissed.has(b.id));

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (visibleBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % visibleBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [visibleBanners.length]);

  if (visibleBanners.length === 0) return null;

  const current = visibleBanners[currentIndex];
  const style = variantStyles[current.variant] || variantStyles.INFO;

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + visibleBanners.length) % visibleBanners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % visibleBanners.length);
  };

  return (
    <div className={`${style.bg} border-l-4 ${style.border} px-4 py-3 relative`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Navigation arrows (only if multiple banners) */}
        {visibleBanners.length > 1 && (
          <button
            onClick={goToPrev}
            className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-card/10 transition"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Content */}
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold text-sm ${style.text}`}>{current.title}</h3>
              {visibleBanners.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  {currentIndex + 1}/{visibleBanners.length}
                </span>
              )}
            </div>
            <p className={`text-sm mt-0.5 ${style.text} opacity-80`}>{current.message}</p>
            {current.ctaLabel && current.ctaUrl && (
              <Link
                href={current.ctaUrl}
                target={current.ctaUrl.startsWith('http') ? '_blank' : undefined}
                rel={current.ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                className={`inline-flex items-center gap-1 mt-2 px-3 py-1 text-xs font-medium rounded-md transition ${style.cta}`}
              >
                {current.ctaLabel}
                {current.ctaUrl.startsWith('http') && <ExternalLink className="w-3 h-3" />}
              </Link>
            )}
          </div>

          {/* Image (hidden on mobile) */}
          {current.imageUrl && (
            <img
              src={current.imageUrl}
              alt={current.title}
              className="hidden md:block w-24 h-16 object-cover rounded-lg flex-shrink-0"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {visibleBanners.length > 1 && (
            <button
              onClick={goToNext}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-card/10 transition"
              aria-label="Next banner"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => dismissBanner(current.id)}
            className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-card/10 transition"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Dots indicator */}
      {visibleBanners.length > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {visibleBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition ${
                i === currentIndex
                  ? 'bg-blue-500 dark:bg-blue-400'
                  : 'bg-muted '
              }`}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
