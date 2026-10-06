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

export const metadata: Metadata = {
  title: 'A+ Mentality',
  description: 'Learning Management System',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
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
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
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