import Link from 'next/link';

import { SiteHeader } from '@/components/site-header';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell prose-page">
        <h1>没有找到这个灵魂</h1>
        <p>你可能点到了一个还没收录的 slug，或者链接已经变了。</p>
        <Link href="/souls" className="text-action-link">
          返回灵魂库
        </Link>
      </main>
    </>
  );
}
