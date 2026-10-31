import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const routes = [
    { path: '', priority: 1, frequency: 'daily' as const },
    { path: '/explore', priority: 0.8, frequency: 'daily' as const },
    { path: '/privacy-policy', priority: 0.5, frequency: 'monthly' as const },
    { path: '/terms-of-service', priority: 0.5, frequency: 'monthly' as const },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.frequency,
    priority: route.priority,
  }));
}
