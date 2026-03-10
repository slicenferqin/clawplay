import type { Metadata } from 'next';

import '@/app/globals.css';
import { SiteFooter } from '@/components/site-footer';
import { getBaseMetadata, getSiteStructuredData } from '@/lib/seo';

export const metadata: Metadata = getBaseMetadata();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = getSiteStructuredData();

  return (
    <html lang="zh-CN">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <div className="app-root">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
