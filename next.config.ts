/** @type {import('next').NextConfig} */

// Sentry build-time config — wraps next-pwa with source map upload and instrumentation
const { withSentryConfig } = require('@sentry/nextjs/config');

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Ensure the offline fallback page is always cached
  runtimeCaching: [
    {
      urlPattern: /.*\/.*\.(js|css|woff2|woff|ttf|eot)/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /.*\.(png|jpg|jpeg|svg|gif|webp)/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\/offline\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offline-page',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    {
      urlPattern: /\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 1 day
        },
      },
    },
  ],
});

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    optimizePackageImports: ['framer-motion'],
  },
  // ✅ Silence the Turbopack warning
  turbopack: {},
  // ✅ Security headers including Content-Security-Policy and CORS for manifest
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
              "manifest-src 'self'",
              "img-src 'self' https://res.cloudinary.com https://img.clerk.com data: blob:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev https://cdn.protect.clerk.com https://js.sentry-cdn.com https://browser.sentry-cdn.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "media-src 'self' https://res.cloudinary.com https://www.youtube.com https://youtube.com",
              "connect-src 'self' https://*.clerk.accounts.dev https://cdn.protect.clerk.com https://api.clerk.com https://api.cloudinary.com https://*.sentry.io https://*.ingest.sentry.io https://docs.google.com https://api.emailjs.com",
              "frame-src 'self' https://*.clerk.accounts.dev https://www.youtube.com https://youtube.com https://docs.google.com",
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
      // ✅ CORS headers for manifest.json — fixes PWA installation errors on Vercel
      {
        source: '/manifest.json',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // ✅ CORS headers for site.webmanifest (fallback name)
      {
        source: '/site.webmanifest',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  // ✅ Allow external images (required for Unsplash & Google thumbnails)
  images: {
    qualities: [75, 85],
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