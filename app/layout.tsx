import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ClerkProvider } from '@clerk/nextjs';

// ✅ Add fallback and display options
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // ✅ Prevents layout shift
  fallback: ['system-ui', 'Arial', 'sans-serif'], // ✅ Fallback fonts
  adjustFontFallback: true, // ✅ Adjusts fallback font size
});

export const metadata: Metadata = {
  title: 'A+ Mentality',
  description: 'Learning Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} antialiased`}>
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}