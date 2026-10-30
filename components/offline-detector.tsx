'use client';

import { useEffect, useState } from 'react';

export function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);

  useEffect(() => {
    // Initialize online status
    setIsOnline(typeof window !== 'undefined' ? window.navigator.onLine : true);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineBanner(true);
      // Auto-hide the online banner after 3 seconds
      setTimeout(() => setShowOnlineBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineBanner(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render anything if online and not showing the online banner
  if (isOnline && !showOnlineBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 text-center text-sm font-medium py-2 px-4 transition-colors duration-300 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      }`}
      role="alert"
      aria-live="polite"
    >
      {isOnline ? (
        <span>🟢 Back online. Syncing data...</span>
      ) : (
        <span>🔴 You are offline. Viewing cached content.</span>
      )}
    </div>
  );
}
