import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/privacy-policy', '/terms-of-service', '/explore', '/api/health'],
      disallow: ['/admin/', '/student/', '/tutor/', '/apply-as-tutor/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sitemap.xml`,
  };
}
