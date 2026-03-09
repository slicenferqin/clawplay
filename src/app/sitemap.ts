import type { MetadataRoute } from 'next';

import { buildAbsoluteUrl } from '@/lib/seo';
import { getGrowthCollections } from '@/lib/collections';
import { getAllSouls } from '@/lib/souls';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [souls, collections] = await Promise.all([getAllSouls(), getGrowthCollections()]);
  const now = new Date();

  return [
    {
      url: buildAbsoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: buildAbsoluteUrl('/souls'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: buildAbsoluteUrl('/collections'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    ...collections.map((collection) => ({
      url: buildAbsoluteUrl(collection.pageHref),
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    {
      url: buildAbsoluteUrl('/install'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: buildAbsoluteUrl('/submit'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/about'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...souls.map((soul) => ({
      url: buildAbsoluteUrl(`/souls/${soul.slug}`),
      lastModified: new Date(`${soul.updatedAt}T00:00:00.000Z`),
      changeFrequency: 'weekly' as const,
      priority: soul.featured ? 0.9 : 0.8,
    })),
  ];
}
