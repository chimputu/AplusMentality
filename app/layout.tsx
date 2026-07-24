// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next';
import SimpleChat from '@/components/SimpleChat';

// ✅ Import Inter font weights from @fontsource
import '@fontsource/inter/400.css';   // Regular
import '@fontsource/inter/500.css';   // Medium
import '@fontsource/inter/600.css';   // SemiBold
import '@fontsource/inter/700.css';   // Bold

// No need to define 'inter' with next/font – we use a CSS class instead.
// We'll use the class name 'font-sans' which Tailwind maps to Inter.

export const metadata: Metadata = {
  title: 'A+ Mentality',
  description: 'Learning Management System',
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        </head>
        <body className="font-sans antialiased">
          <Providers>
            {children}
            <SimpleChat />
            <Analytics />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}