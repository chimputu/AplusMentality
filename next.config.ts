/** @type {import('next').NextConfig} */

// Sentry build-time config — wraps next-pwa with source map upload and instrumentation
const { withSentryConfig } = require('@sentry/nextjs/config');

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // ✅ Silence the Turbopack warning
  turbopack: {},
  // ✅ Security headers including Content-Security-Policy
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // CSP — restricts where resources can be loaded from, preventing XSS
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "manifest-src 'self' https://vercel.com",
              "img-src 'self' https://res.cloudinary.com https://img.clerk.com data: blob:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev https://cdn.protect.clerk.com https://js.sentry-cdn.com https://browser.sentry-cdn.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "connect-src 'self' https://*.clerk.accounts.dev https://cdn.protect.clerk.com https://api.clerk.com https://api.cloudinary.com https://*.sentry.io https://*.ingest.sentry.io https://vercel.com",
              "frame-src 'self' https://*.clerk.accounts.dev https://www.youtube.com https://youtube.com",
              "worker-src 'self' blob:",
              "frame-ancestors 'self'",
            ].join('; '),
          },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  // ✅ Allow external images (required for Unsplash & Google thumbnails)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',    // For all Unsplash images
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com', // For the Mulungushi logo
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com', // For YouTube video thumbnails
      },
    ],
  },
};

// Wrap with PWA first, then with Sentry for source map upload
module.exports = withSentryConfig(withPWA(nextConfig), {
  // Disable Sentry auto-instrumentation for server components (handled by config files)
  autoInstrumentServerComponents: true,
  autoInstrumentAppRoutes: true,
  autoInstrumentMiddleware: true,
  hideSourceMaps: true,
  sourcemaps: {
    disable: false,
  },
});