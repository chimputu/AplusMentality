/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Increase API body size limit to 50MB
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  
  // ✅ For Next.js 14+ with App Router
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  images: {
    domains: ['img.clerk.com', 'res.cloudinary.com'],
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;