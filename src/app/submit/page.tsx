import Link from 'next/link';
import type { Metadata } from 'next';

import { AnalyticsViewTracker } from '@/components/analytics-view-tracker';
import { SiteHeader } from '@/components/site-header';
import { SoulSubmissionForm } from '@/components/soul-submission-form';
import { buildPageMetadata } from '@/lib/seo';
import { SITE_NAME } from '@/lib/site-config';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildPageMetadata({
  title: '投稿一个 Soul preset',
  description: '分享一个可导入的 Soul 人格起点。支持直接上传 .md 文件，先交关键项，展示信息后补。',
  pathname: '/submit',
  keywords: ['投稿', 'Soul 收录', '上传 md', 'OpenClaw 社区'],
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
            <h1 className="page-heading__title">分享你的 Soul 人格起点，首稿只交关键项</h1>
            <p className="page-heading__description">
              你不需要一上来就把它写成运营稿。标题、简介、原始 SOUL、作者、协议这些关键项先交上来；标签、人格描述、示例对话和联系方式都可以后面再补。
            </p>
          </div>
          <div className="submit-hero__aside detail-panel detail-panel--side">
            <h2 className="detail-panel__title detail-panel__title--small">首稿最低门槛</h2>
            <ul className="detail-panel__list detail-panel__list--compact">
              <li>一个可导入的起始 Soul，一般 1-2 分钟就能填完</li>
              <li>支持直接上传 `.md` 文件，省掉复制粘贴</li>
              <li>翻译 / 改编只要把来源链路说明清楚</li>
            </ul>
            <div className="detail-panel__actions">
              <Link href="/about" className="text-action-link">查看投稿与审核规则</Link>
            </div>
          </div>
        </section>

        <section className="submission-form__section submission-guidance is-ready">
          <div className="submission-form__section-header">
            <h2>投稿前先知道这三件事</h2>
            <p>{SITE_NAME} 想做的不是把门槛拉高，而是先把值得保存的人格 preset 收进来，再慢慢补齐展示信息。</p>
          </div>

          <div className="submission-guidance__grid">
            <article className="submission-guidance__panel">
              <div className="submission-guidance__summary is-ready">
                <strong>先交一个可导入的起始 Soul</strong>
                <span>原始 `.md`、标题、简介、作者、协议先齐，就够开始审核。</span>
              </div>
              <ul className="submission-guidance__checklist">
                <li>支持直接上传 `.md` 文件，不必先手动整理成“完美展示页”。</li>
                <li>暂时没有完整的人格描述、预览或详细介绍，也不会挡住首稿提交。</li>
                <li>真正决定能不能发布的，是内容是否可用、是否可信，而不是文案是否花哨。</li>
              </ul>
            </article>

            <article className="submission-guidance__panel">
              <div className="submission-guidance__summary is-blocked">
                <strong>审核最看重可信与可用</strong>
                <span>来源、授权、原文完整度和是否适合作为公开人格 preset，会优先被检查。</span>
              </div>
              <ul className="submission-guidance__checklist">
                <li>翻译 / 改编稿件至少要附原始来源链接，最好同时写清原作者。</li>
                <li>正式标签不会直接自由生长，用户可以提议，后台会归并或收录。</li>
                <li>如果还需要更多资料，你会通过私密管理链接继续补，不用这次一次写完。</li>
              </ul>
            </article>
          </div>

          <p className="submission-guidance__notice">如果你现在只有原始 `SOUL.md`，先把这个灵魂起点投进来，比等到所有展示文案都打磨漂亮更重要。</p>
        </section>

        <SoulSubmissionForm />
      </main>
    </>
  );
}
