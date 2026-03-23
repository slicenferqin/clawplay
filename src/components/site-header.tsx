import Link from 'next/link';

import { ArrowRightIcon, SparkIcon } from '@/components/icons';
import { SITE_NAME } from '@/lib/site-config';

const navItems = [
  { href: '/souls', label: '灵魂库' },
  { href: '/collections', label: '合集' },
  { href: '/install', label: '导入' },
  { href: '/submit', label: '投稿' },
  { href: '/about', label: '关于' },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner page-shell">
        <Link href="/" className="brand-mark">
          <SparkIcon className="brand-mark__icon" />
          <span className="brand-mark__text">{SITE_NAME}</span>
        </Link>

        <nav className="site-nav" aria-label="主导航">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="site-nav__link">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/install" className="header-cta">
          <span>查看导入说明</span>
          <ArrowRightIcon className="header-cta__icon" />
        </Link>
      </div>
    </header>
  );
}
