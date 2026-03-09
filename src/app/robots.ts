import type { MetadataRoute } from 'next';

import { buildAbsoluteUrl, getSiteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/souls', '/install', '/submit', '/about'],
      disallow: ['/admin/', '/api/', '/submissions/'],
    },
    sitemap: buildAbsoluteUrl('/sitemap.xml'),
    host: new URL(getSiteUrl()).host,
  };
}
