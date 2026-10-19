import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/student/', '/tutor/', '/apply-as-tutor/'],
    },
    sitemap: 'https://aplusmentality.vercel.app/sitemap.xml',
  };
}
