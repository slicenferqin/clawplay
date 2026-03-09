import Link from 'next/link';
import type { Metadata } from 'next';

import { SiteHeader } from '@/components/site-header';
import { SiteSearchForm } from '@/components/site-search-form';
import { buildPageMetadata } from '@/lib/seo';
import { filterSouls, getAllSouls, getCategoryCounts, getSourceTypeCounts } from '@/lib/souls';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildPageMetadata({
  title: '全部灵魂',
  description: '按标题、标签、场景、兼容模型和内容来源浏览 ClawPlay 收录的全部 Soul。',
  pathname: '/souls',
  keywords: ['全部灵魂', 'SOUL 列表', '标签筛选', '翻译 Soul', 'OpenClaw Soul'],
});

function buildSoulsHref(params: { q?: string; category?: string; sourceType?: string }) {
  const search = new URLSearchParams();

  if (params.q) {
    search.set('q', params.q);
  }

  if (params.category) {
    search.set('category', params.category);
  }

  if (params.sourceType) {
    search.set('sourceType', params.sourceType);
  }

  const queryString = search.toString();
  return queryString ? `/souls?${queryString}` : '/souls';
}

export default async function SoulsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = ((await searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  const query = typeof params.q === 'string' ? params.q : '';
  const category = typeof params.category === 'string' ? params.category : '';
  const sourceType = typeof params.sourceType === 'string' ? params.sourceType : '';
  const [allSouls, categories, sourceTypes] = await Promise.all([getAllSouls(), getCategoryCounts(), getSourceTypeCounts()]);
  const souls = filterSouls(allSouls, { query, category, sourceType });

  return (
    <>
      <SiteHeader />
      <main className="page-shell list-page">
        <section className="page-heading">
          <h1 className="page-heading__title">全部灵魂</h1>
          <p className="page-heading__description">按用途、来源、角色语气和实际使用感受来筛选。</p>
        </section>

        <div className="toolbar-row">
          <SiteSearchForm
            placeholder="按标题、标签、场景或模型搜索"
            defaultValue={query}
            hiddenFields={{ category: category || undefined, sourceType: sourceType || undefined }}
          />
          <span className="toolbar-row__sort">排序：精选</span>
        </div>

        <section className="list-layout">
          <aside className="filter-panel">
            <div>
              <h2 className="filter-panel__title">筛选</h2>
              <div className="filter-group">
                <span className="filter-group__label">用途分类</span>
                <div className="filter-group__links">
                  <Link href={buildSoulsHref({ q: query || undefined, sourceType: sourceType || undefined })} className={!category ? 'is-active' : ''}>
                    全部
                  </Link>
                  {categories.map((item) => (
                    <Link
                      key={item.key}
                      href={buildSoulsHref({ q: query || undefined, category: item.key, sourceType: sourceType || undefined })}
                      className={category === item.key ? 'is-active' : ''}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-group__label">内容来源</span>
                <div className="filter-group__links">
                  <Link href={buildSoulsHref({ q: query || undefined, category: category || undefined })} className={!sourceType ? 'is-active' : ''}>
                    全部
                  </Link>
                  {sourceTypes.map((item) => (
                    <Link
                      key={item.key}
                      href={buildSoulsHref({ q: query || undefined, category: category || undefined, sourceType: item.key })}
                      className={sourceType === item.key ? 'is-active' : ''}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-group__label">风格</span>
                <p>严谨 / 温暖 / 活泼 / 结构化</p>
              </div>
              <div className="filter-group">
                <span className="filter-group__label">模型</span>
                <p>Sonnet / Opus / 通用</p>
              </div>
            </div>
          </aside>

          <div className="result-list">
            {souls.length > 0 ? (
              souls.map((soul) => (
                <article key={soul.slug} className="result-card">
                  <div className="result-card__meta">
                    {soul.categoryLabel} / {soul.sourceType} / 更新于 {soul.updatedAt}
                  </div>
                  <h2 className="result-card__title">
                    <Link href={`/souls/${soul.slug}`}>{soul.title}</Link>
                  </h2>
                  <p className="result-card__summary">{soul.summary}</p>
                  <div className="result-card__footer">
                    <span>标签：{soul.tags.join(' / ')}</span>
                    <span>兼容：{soul.compatibleModels.join('、')}</span>
                    <Link href={`/souls/${soul.slug}`}>查看详情</Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <h2>没有找到匹配的灵魂</h2>
                <p>试试换一个关键词，或者先按用途分类 / 内容来源浏览。</p>
                <Link href="/souls">清空筛选</Link>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
