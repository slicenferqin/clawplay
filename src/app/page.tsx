import Link from 'next/link';

import { FeaturedSoulCard } from '@/components/featured-soul-card';
import { SiteHeader } from '@/components/site-header';
import { SiteSearchForm } from '@/components/site-search-form';
import { SoulCard } from '@/components/soul-card';
import { getCategoryCounts, getFeaturedSouls } from '@/lib/souls';

export default async function HomePage() {
  const [featuredSouls, collections] = await Promise.all([getFeaturedSouls(), getCategoryCounts()]);
  const heroSoul = featuredSouls[0];

  return (
    <>
      <SiteHeader />
      <main className="page-shell home-page">
        <section className="hero-grid">
          <div className="hero-grid__content">
            <p className="eyebrow">为 OpenClaw 精选的中文 Soul</p>
            <h1 className="hero-grid__title">先看感觉，再决定装哪个灵魂。</h1>
            <p className="hero-grid__description">
              ClawPlay 把零散的 <code>SOUL.md</code> 整理成可浏览、可比较、可安装的中文目录站。
            </p>
            <SiteSearchForm placeholder="搜索灵魂、角色、使用场景" />
            <div className="hero-stats">
              <span>8 个已收录灵魂</span>
              <span>3 条核心路径</span>
              <span>curl 安装</span>
            </div>
          </div>
          {heroSoul ? <FeaturedSoulCard soul={heroSoul} /> : null}
        </section>

        <section className="content-section">
          <div className="section-heading-row">
            <h2 className="section-title">精选灵魂</h2>
            <Link href="/souls" className="section-link">
              查看全部
            </Link>
          </div>
          <div className="soul-grid soul-grid--three">
            {featuredSouls.map((soul) => (
              <SoulCard key={soul.slug} soul={soul} />
            ))}
          </div>
        </section>

        <section className="content-section" id="collections">
          <h2 className="section-title">按合集浏览</h2>
          <div className="collection-grid">
            {collections.map((collection) => (
              <Link
                key={collection.key}
                href={`/souls?category=${collection.key}`}
                className="collection-card"
              >
                <span className="collection-card__title">{collection.label}</span>
                <span className="collection-card__count">{collection.count} 个灵魂</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="install-strip">
          <p>安装说明包含备份、回滚和原始 SOUL 查看。</p>
          <Link href="/install">查看安装说明</Link>
        </section>
      </main>
    </>
  );
}
