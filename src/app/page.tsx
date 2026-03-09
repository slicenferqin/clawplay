import Link from 'next/link';
import type { Metadata } from 'next';

import { ArrowRightIcon } from '@/components/icons';
import { HeroShowcase } from '@/components/hero-showcase';
import { SiteHeader } from '@/components/site-header';
import { SoulCard } from '@/components/soul-card';
import { buildPageMetadata } from '@/lib/seo';
import { getAllSouls, getCategoryCounts, getFeaturedSouls, getSourceTypeCounts } from '@/lib/souls';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildPageMetadata({
  title: 'OpenClaw 中文 SOUL 灵魂库',
  description: '把零散的 SOUL.md 整理成可浏览、可比较、可安装的中文灵魂库。先看预览，再决定装哪个灵魂。',
  pathname: '/',
  keywords: ['灵魂库', 'SOUL 目录', '安装命令', '投稿收录', '中文 Soul'],
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
            <h2 className="section-title">为什么先来 ClawPlay</h2>
          </div>
          <div className="journey-grid">
            <article className="journey-card">
              <span className="journey-card__eyebrow">01 先浏览</span>
              <h3 className="journey-card__title">不用再靠群聊翻历史消息找 Soul</h3>
              <p className="journey-card__description">先看简介、标签、用途和来源类型，把零散的 Soul 放回一个能浏览的目录里。</p>
              <Link href="/souls" className="text-action-link">
                <span>去灵魂库</span>
                <ArrowRightIcon className="text-action-link__icon" />
              </Link>
            </article>

            <article className="journey-card">
              <span className="journey-card__eyebrow">02 再比较</span>
              <h3 className="journey-card__title">先看预览和原文，再决定它是不是你的菜</h3>
              <p className="journey-card__description">不是先装了再碰运气，而是先看风格、能力和原始 SOUL 内容，再做选择。</p>
              <Link href="/souls/code-reviewer" className="text-action-link">
                <span>看一个示例</span>
                <ArrowRightIcon className="text-action-link__icon" />
              </Link>
            </article>

            <article className="journey-card">
              <span className="journey-card__eyebrow">03 最后安装 / 投稿</span>
              <h3 className="journey-card__title">喜欢就复制命令安装，调教好了也能继续分享</h3>
              <p className="journey-card__description">支持直接拉取原始 SOUL，也支持上传 `.md` 文件投稿，把好内容继续沉淀回站里。</p>
              <div className="journey-card__actions">
                <Link href="/install" className="text-action-link">
                  <span>看安装</span>
                  <ArrowRightIcon className="text-action-link__icon" />
                </Link>
                <Link href="/submit" className="text-action-link">
                  <span>去投稿</span>
                  <ArrowRightIcon className="text-action-link__icon" />
                </Link>
              </div>
            </article>
          </div>
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
          <div className="install-strip__content">
            <p className="install-strip__title">找到喜欢的 Soul 后，先看预览，再复制安装命令。</p>
            <p>安装说明里已经把备份、替换、下载、回滚都写好；如果你也调教出了好用的 Soul，也可以直接上传 `.md` 文件投稿。</p>
          </div>
          <div className="install-strip__actions">
            <Link href="/install">查看安装说明</Link>
            <Link href="/submit">投稿我的 Soul</Link>
          </div>
        </section>
      </main>
    </>
  );
}
