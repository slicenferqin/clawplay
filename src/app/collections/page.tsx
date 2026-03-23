import Link from 'next/link';
import type { Metadata } from 'next';

import { SiteHeader } from '@/components/site-header';
import { SoulCard } from '@/components/soul-card';
import { buildPageMetadata } from '@/lib/seo';
import { SITE_NAME } from '@/lib/site-config';
import { getCollectionGroups, getCollectionKindLabel } from '@/lib/collections';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildPageMetadata({
  title: '专题合集',
  description: '先看新手首选、开发首选等入口型合集，再按谋士系、温润陪伴系、毒舌直给系和角色感拉满这些人格专题继续比较。',
  pathname: '/collections',
  keywords: ['专题合集', '人格专题', '新手首选', '开发首选', '谋士系', '温润陪伴系', '毒舌直给系', '角色感拉满'],
});

export default async function CollectionsPage() {
  const groups = await getCollectionGroups();
  const overviewCollections = groups.flatMap((group) => group.collections);

  return (
    <>
      <SiteHeader />
      <main className="page-shell growth-page">
        <section className="page-heading growth-page__hero">
          <p className="eyebrow">先按入口收口，再按人格比较</p>
          <h1 className="page-heading__title">不知道先导入哪种 Soul，就先从这些专题开始</h1>
          <p className="page-heading__description">
            {SITE_NAME} 现在把合集分成两类：一类解决“第一次从哪组开始看”，另一类解决“我更喜欢哪种人格气质”。你可以先降低选择成本，再去比较灵魂之间真正的相处体感。
          </p>
          <div className="growth-overview-grid">
            {overviewCollections.map((collection) => (
              <Link key={collection.key} href={collection.pageHref} className="growth-overview-card">
                <span className="growth-overview-card__eyebrow">{collection.eyebrow}</span>
                <strong className="growth-overview-card__title">{collection.title}</strong>
                <p className="growth-overview-card__summary">{collection.summary}</p>
                <span className="growth-overview-card__meta">
                  {getCollectionKindLabel(collection.kind)} · {collection.souls.length} 个推荐入口
                </span>
              </Link>
            ))}
          </div>
        </section>

        {groups.map((group) => (
          <section key={group.key} className="content-section growth-group">
            <div className="growth-group__header">
              <p className="eyebrow">{group.eyebrow}</p>
              <h2 className="section-title">{group.title}</h2>
              <p className="growth-group__description">{group.description}</p>
            </div>

            <div className="growth-group__collections">
              {group.collections.map((collection) => (
                <article key={collection.key} id={collection.key} className="growth-collection-block">
                  <div className="section-heading-row growth-section__row">
                    <div className="growth-section__heading">
                      <p className="detail-panel__eyebrow">{collection.eyebrow}</p>
                      <h3 className="section-title">{collection.title}</h3>
                      <p className="growth-section__description">{collection.summary}</p>
                    </div>
                    <Link href={collection.pageHref} className="section-link">
                      打开专题页
                    </Link>
                  </div>
                  <p className="growth-section__note">{collection.note}</p>
                  <div className="growth-section__actions">
                    <Link href={collection.browseHref} className="text-action-link">
                      {collection.browseLabel}
                    </Link>
                  </div>
                  <div className="soul-grid soul-grid--three">
                    {collection.souls.map((soul) => (
                      <SoulCard key={`${collection.key}-${soul.slug}`} soul={soul} />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="install-strip growth-page__closing">
          <div className="install-strip__content">
            <p className="install-strip__title">先从专题缩小范围，再去详情页看人格结构、原始 SOUL 和 Soul Pack。</p>
            <p>专题页负责收口选择范围；真正决定要不要导入，还是建议你点进详情页看人格画像、示例对话、原始内容和导入说明。</p>
          </div>
          <div className="install-strip__actions">
            <Link href="/souls">回到灵魂库</Link>
            <Link href="/install">查看导入说明</Link>
          </div>
        </section>
      </main>
    </>
  );
}
