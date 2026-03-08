import Link from 'next/link';

import { AnalyticsViewTracker } from '@/components/analytics-view-tracker';
import { SiteHeader } from '@/components/site-header';
import { SoulSubmissionForm } from '@/components/soul-submission-form';

export const dynamic = 'force-dynamic';

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
            <h1 className="page-heading__title">把你调教好的 Soul 正式投进 ClawPlay</h1>
            <p className="page-heading__description">
              现在开始，不会 GitHub PR 也能投稿。你提交后会拿到一条私密管理链接，用来查看审核状态、补充资料和跟进发布进度。
            </p>
          </div>
          <div className="submit-hero__aside detail-panel detail-panel--side">
            <h2 className="detail-panel__title detail-panel__title--small">投稿前建议</h2>
            <ul className="detail-panel__list detail-panel__list--compact">
              <li>先把标题、简介、适用场景和示例对话写完整</li>
              <li>翻译或改编内容请明确原作者、来源和协议</li>
              <li>原始 SOUL.md 尽量贴可直接安装的最终版本</li>
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
