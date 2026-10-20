import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Personal progress pages have nothing to index.
        disallow: ['/api/', '/dashboard'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}