import Link from 'next/link';
import type { Metadata } from 'next';

import { SiteHeader } from '@/components/site-header';
import { SoulCard } from '@/components/soul-card';
import { buildPageMetadata } from '@/lib/seo';
import { getGrowthCollections } from '@/lib/collections';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildPageMetadata({
  title: '推荐合集',
  description: '如果你第一次来不知道先装哪个 Soul，就从新手首选、开发首选、当前热门和最近新增开始。',
  pathname: '/collections',
  keywords: ['推荐合集', '新手首选', '开发首选', '当前热门', '最近新增'],
});

export default async function CollectionsPage() {
  const collections = await getGrowthCollections();

  return (
    <>
      <SiteHeader />
      <main className="page-shell growth-page">
        <section className="page-heading growth-page__hero">
          <p className="eyebrow">给第一次选择更低的门槛</p>
          <h1 className="page-heading__title">不知道先装哪个 Soul，就先从这些合集开始</h1>
          <p className="page-heading__description">
            ClawPlay 先不做复杂推荐系统。第一刀只做几组低认知成本、可直接上手的入口，帮你更快找到第一批值得试的 Soul。
          </p>
          <div className="growth-overview-grid">
            {collections.map((collection) => (
              <a key={collection.key} href={`#${collection.key}`} className="growth-overview-card">
                <span className="growth-overview-card__eyebrow">{collection.eyebrow}</span>
                <strong className="growth-overview-card__title">{collection.title}</strong>
                <p className="growth-overview-card__summary">{collection.summary}</p>
                <span className="growth-overview-card__meta">{collection.souls.length} 个推荐入口</span>
              </a>
            ))}
          </div>
        </section>

        {collections.map((collection) => (
          <section key={collection.key} id={collection.key} className="content-section growth-section">
            <div className="section-heading-row growth-section__row">
              <div className="growth-section__heading">
                <p className="detail-panel__eyebrow">{collection.eyebrow}</p>
                <h2 className="section-title">{collection.title}</h2>
                <p className="growth-section__description">{collection.summary}</p>
              </div>
              <Link href={collection.ctaHref} className="section-link">
                {collection.ctaLabel}
              </Link>
            </div>
            <p className="growth-section__note">{collection.note}</p>
            <div className="soul-grid soul-grid--three">
              {collection.souls.map((soul) => (
                <SoulCard key={`${collection.key}-${soul.slug}`} soul={soul} />
              ))}
            </div>
          </section>
        ))}

        <section className="install-strip growth-page__closing">
          <div className="install-strip__content">
            <p className="install-strip__title">先从合集挑一个，再去详情页看预览和原始 SOUL。</p>
            <p>合集页负责降低第一次选择成本；真正决定要不要装，还是建议你点进详情页看预览卡、示例对话和原始内容。</p>
          </div>
          <div className="install-strip__actions">
            <Link href="/souls">回到灵魂库</Link>
            <Link href="/install">查看安装指南</Link>
          </div>
        </section>
      </main>
    </>
  );
}
