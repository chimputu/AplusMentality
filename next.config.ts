/** @type {import('next').NextConfig} */

// Sentry build-time config — wraps nextConfig with source map upload and instrumentation
const { withSentryConfig } = require('@sentry/nextjs/config');
// Serwist PWA — replaces next-pwa (incompatible with Next.js 16)
const withSerwistInit = require('@serwist/next').default;
const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
});

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    optimizePackageImports: ['framer-motion', 'recharts'],
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
              // 'unsafe-inline' required for Clerk and Next.js dynamic styles
              // 'unsafe-eval' required for Clerk — document why if removing breaks auth
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev https://cdn.protect.clerk.com https://js.sentry-cdn.com https://browser.sentry-cdn.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "media-src 'self' https://res.cloudinary.com https://www.youtube.com https://youtube.com",
              "connect-src 'self' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://cdn.protect.clerk.com https://api.clerk.com https://api.cloudinary.com https://*.sentry.io https://*.ingest.sentry.io https://docs.google.com https://api.emailjs.com https://openrouter.ai",
              "frame-src 'self' https://*.clerk.accounts.dev https://www.youtube.com https://youtube.com https://docs.google.com",
              "worker-src 'self' blob: https://bm-smrwsawvav22aok.public.bumpl.cloud",
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
      // ✅ CORS headers for manifest.json — fixes PWA installation errors
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
      // ✅ Digital Asset Links for TWA (Trusted Web Activity)
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  // ✅ Allow external images (required for Unsplash & Google thumbnails)
  // Vercel supports Edge image optimization — enable AVIF/WebP for smaller payloads
  images: {
    formats: ['image/avif', 'image/webp'],
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

// Wrap with Serwist for PWA, then with Sentry for source map upload
module.exports = withSentryConfig(withSerwist(nextConfig), {
  // Disable Sentry auto-instrumentation for server components (handled by config files)
  autoInstrumentServerComponents: true,
  autoInstrumentAppRoutes: true,
  autoInstrumentMiddleware: true,
  // SECURITY: Hide source maps from public access in production
  hideSourceMaps: true,
  sourcemaps: {
    disable: true, // SECURITY: Disable public source maps; Sentry uses its own upload
  },
});