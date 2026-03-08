import Link from 'next/link';
import type { Metadata } from 'next';

import { AnalyticsViewTracker } from '@/components/analytics-view-tracker';
import { SiteHeader } from '@/components/site-header';
import { SoulSubmissionForm } from '@/components/soul-submission-form';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildPageMetadata({
  title: '投稿你的 Soul',
  description: '把你调教好的 OpenClaw Soul 投稿到 ClawPlay，首稿只填核心信息，其余内容可后续补充。',
  pathname: '/submit',
  keywords: ['投稿', 'Soul 收录', '匿名投稿', 'OpenClaw 社区'],
});

export default function SubmitPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell submit-page">
        <AnalyticsViewTracker
          eventName="submission_page_view"
          source="submission"
          placement="submit_page"
          storageKey="submission_page_view"
        />

        <section className="submit-hero">
          <div className="submit-hero__content">
            <p className="eyebrow">投稿入口</p>
            <h1 className="page-heading__title">先把 Soul 投进来，不用一上来就填满所有展示信息</h1>
            <p className="page-heading__description">
              现在首稿只收核心信息：标题、简介、原始 SOUL、作者、协议这些关键项先交上来；标签、预览示例和联系方式都可以后面再补。
            </p>
          </div>
          <div className="submit-hero__aside detail-panel detail-panel--side">
            <h2 className="detail-panel__title detail-panel__title--small">现在的投稿节奏</h2>
            <ul className="detail-panel__list detail-panel__list--compact">
              <li>原创首稿一般 1-2 分钟就能填完</li>
              <li>翻译 / 改编多补一个来源链接即可</li>
              <li>如果审核需要更多信息，再通过私密链接继续补</li>
            </ul>
            <div className="detail-panel__actions">
              <Link href="/souls" className="text-action-link">先看看现有灵魂</Link>
            </div>
          </div>
        </section>

        <SoulSubmissionForm />
      </main>
    </>
  );
}
