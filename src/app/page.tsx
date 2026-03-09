import Link from 'next/link';
import type { Metadata } from 'next';

import { HeroShowcase } from '@/components/hero-showcase';
import { SiteHeader } from '@/components/site-header';
import { SoulCard } from '@/components/soul-card';
import { buildPageMetadata } from '@/lib/seo';
import { getAllSouls, getCategoryCounts, getFeaturedSouls, getSourceTypeCounts } from '@/lib/souls';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildPageMetadata({
  title: 'OpenClaw 中文 SOUL 灵魂库',
  description: '浏览热门 Soul、查看预览卡、复制安装命令，并挑选适合自己 OpenClaw 的灵魂角色。',
  pathname: '/',
  keywords: ['灵魂库', 'SOUL 目录', '安装命令', '投稿收录'],
});

export default async function HomePage() {
  const [allSouls, featuredSouls, collections, sourceCollections] = await Promise.all([
    getAllSouls(),
    getFeaturedSouls(),
    getCategoryCounts(),
    getSourceTypeCounts(),
  ]);
  const heroSoulDefinitions = [
    { slug: 'edict-counselor', displayName: '御用谋士' },
    { slug: 'grumpy-wang', displayName: '暴躁老王' },
    { slug: 'code-reviewer', displayName: '代码审查官' },
    { slug: 'catgirl-nova', displayName: '猫娘 Nova' },
    { slug: 'architect', displayName: '软件架构师' },
  ];
  const soulsBySlug = new Map(allSouls.map((soul) => [soul.slug, soul]));
  const heroSouls = heroSoulDefinitions
    .map(({ slug, displayName }) => {
      const soul = soulsBySlug.get(slug);
      if (!soul) {
        return null;
      }

      return {
        slug: soul.slug,
        title: soul.title,
        summary: soul.summary,
        tags: soul.tags,
        displayName,
      };
    })
    .filter((soul): soul is NonNullable<typeof soul> => Boolean(soul));

  return (
    <>
      <SiteHeader />
      <main className="page-shell home-page">
        <HeroShowcase soulCount={allSouls.length} souls={heroSouls} />

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
          <h2 className="section-title">按用途浏览</h2>
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

        <section className="content-section">
          <h2 className="section-title">按来源浏览</h2>
          <div className="collection-grid">
            {sourceCollections.map((collection) => (
              <Link
                key={collection.key}
                href={`/souls?sourceType=${encodeURIComponent(collection.key)}`}
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
