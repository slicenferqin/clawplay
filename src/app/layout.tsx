import type { Metadata } from 'next';

import '@/app/globals.css';
import { SiteFooter } from '@/components/site-footer';
import { getBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = getBaseMetadata();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-root">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
