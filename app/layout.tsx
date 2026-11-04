// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
// Use local @fontsource/inter instead of next/font/google to avoid build-time
// network dependency on fonts.googleapis.com (unreachable in some environments).
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import { Providers } from './providers';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import CookieConsentModal from '@/components/CookieConsentModal';
import DownloadBanner from '@/components/DownloadBanner';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: {
    default: 'A+ Mentality',
    template: '%s | A+ Mentality',
  },
  description: 'Learning Management System — courses, quizzes, assignments, past papers, and tutor services for Zambian universities.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
  openGraph: {
    title: 'A+ Mentality',
    description: 'Learning Management System for Zambian universities.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: 'A+ Mentality',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'A+ Mentality',
    description: 'Learning Management System for Zambian universities.',
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        variables: { colorPrimary: '#2563eb' },
      }}
    >
      <html lang="en" suppressHydrationWarning className="font-inter">
        <body className="font-sans antialiased bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-[100] bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Skip to main content
          </a>
          <Providers>
            <div id="main-content">{children}</div>
            <Toaster />
            <CookieConsentModal />
            <DownloadBanner />
            <Analytics />
            <SpeedInsights />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}