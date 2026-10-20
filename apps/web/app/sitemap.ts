import type { MetadataRoute } from 'next';

import { CHALLENGES } from '@challenges/data';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified, priority: 1 },
    { url: `${BASE_URL}/challenges`, lastModified, priority: 0.9 },
    { url: `${BASE_URL}/leaderboard`, lastModified, priority: 0.6 },
  ];

  const challengeRoutes: MetadataRoute.Sitemap = CHALLENGES.map((challenge) => ({
    url: `${BASE_URL}/challenge/${challenge.slug}`,
    lastModified,
    priority: 0.8,
  }));

  return [...staticRoutes, ...challengeRoutes];
}