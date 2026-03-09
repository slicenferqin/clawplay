import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteHeader } from '@/components/site-header';
import { SoulCard } from '@/components/soul-card';
import { getGrowthCollectionByKey, getGrowthCollectionKeys } from '@/lib/collections';
import { buildNoIndexMetadata, buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return getGrowthCollectionKeys().map((key) => ({ key }));
}

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const collection = await getGrowthCollectionByKey(key);

  if (!collection) {
    return buildNoIndexMetadata({
      title: '合集不存在',
      description: '你访问的合集可能还没开放，或者地址已经变化。',
    });
  }

  return buildPageMetadata({
    title: `${collection.title}专题`,
    description: collection.summary,
    pathname: collection.pageHref,
    ogImagePath: `${collection.pageHref}/opengraph-image`,
    keywords: [collection.title, ...collection.shareBadges, ...collection.souls.flatMap((soul) => soul.tags.slice(0, 2))],
  });
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const collection = await getGrowthCollectionByKey(key);

  if (!collection) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="page-shell prose-page growth-detail-page">
        <p className="breadcrumb">合集 / {collection.title}</p>

        <section className="growth-detail-page__hero">
          <p className="eyebrow">{collection.eyebrow}</p>
          <h1 className="page-heading__title">{collection.title}</h1>
          <p className="prose-page__lead">{collection.summary}</p>
          <div className="prose-page__actions">
            <Link href={collection.browseHref} className="header-cta">
              {collection.browseLabel}
            </Link>
            <Link href="/collections" className="text-action-link">
              返回合集总览
            </Link>
          </div>
        </section>

        <section>
          <h2>为什么先看这组</h2>
          <p>{collection.detailLead}</p>
          <div className="prose-page__card-grid">
            {collection.highlights.map((item) => (
              <article key={item} className="prose-page__mini-card growth-detail-highlight-card">
                <h3>推荐理由</h3>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2>适合这组的人</h2>
          <ul className="growth-detail-list">
            {collection.fitFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="prose-page__callout">{collection.note}</p>
        </section>

        <section>
          <div className="section-heading-row growth-detail-page__section-row">
            <h2>推荐灵魂</h2>
            <Link href="/souls" className="section-link">
              查看全部灵魂
            </Link>
          </div>
          <div className="soul-grid soul-grid--three">
            {collection.souls.map((soul) => (
              <SoulCard key={`${collection.key}-${soul.slug}`} soul={soul} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
