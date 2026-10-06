/** @type {import('next').NextConfig} */

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
  // ✅ Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
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
    ],
  },
};

module.exports = withPWA(nextConfig);