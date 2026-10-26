// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from 'sonner';
import CookieConsentModal from '@/components/CookieConsentModal';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

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
    url: 'https://aplusmentality.vercel.app',
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
    canonical: 'https://aplusmentality.vercel.app',
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
    >
      <html lang="en" suppressHydrationWarning className={inter.variable}>
        <body className={`${inter.className} font-sans antialiased`}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-[100] bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Skip to main content
          </a>
          <Providers>
            <div id="main-content">{children}</div>
            <Toaster />
            <Analytics />
            <CookieConsentModal />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}