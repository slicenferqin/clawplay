import Link from 'next/link';

import { GITHUB_REPO_URL } from '@/lib/site-config';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner page-shell">
        <div className="site-footer__brand">
          <strong>ClawPlay</strong>
          <p>把零散的中文 `SOUL.md` 整理成可发现、可比较、可导入、可投稿的 Soul 人格分享平台。</p>
        </div>

        <nav className="site-footer__nav" aria-label="页脚导航">
          <Link href="/souls">灵魂库</Link>
          <Link href="/collections">合集</Link>
          <Link href="/install">导入</Link>
          <Link href="/submit">投稿</Link>
          <Link href="/about">关于</Link>
          <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">ClawPlay GitHub 仓库</a>
        </nav>
      </div>
    </footer>
  );
}
