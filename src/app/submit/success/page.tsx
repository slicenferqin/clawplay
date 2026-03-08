import Link from 'next/link';

import { AnalyticsViewTracker } from '@/components/analytics-view-tracker';
import { CopyButton } from '@/components/copy-button';
import { SiteHeader } from '@/components/site-header';

export const dynamic = 'force-dynamic';

export default async function SubmitSuccessPage({ searchParams }: { searchParams: Promise<{ publicId?: string; manageUrl?: string }> }) {
  const { publicId = '', manageUrl = '' } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="page-shell prose-page success-page">
        <AnalyticsViewTracker
          eventName="submission_success_view"
          source="submission"
          placement="submit_success"
          storageKey={`submission_success:${publicId}`}
        />
        <section className="detail-panel detail-panel--tinted success-panel">
          <p className="detail-panel__eyebrow">投稿已进入队列</p>
          <h1 className="detail-panel__title">这份 Soul 已经收到了</h1>
          <p className="detail-panel__body">
            当前状态为 <strong>待审核</strong>。请保存下面这条私密管理链接，后续查看状态、补充资料都要靠它。
          </p>
          <div className="success-panel__meta">
            <span>投稿编号：{publicId || '未生成'}</span>
          </div>
          <code className="command-block success-panel__command">{manageUrl || '未生成管理链接'}</code>
          <div className="detail-panel__actions">
            {manageUrl ? <CopyButton text={manageUrl} label="复制管理链接" /> : null}
            {manageUrl ? <Link href={manageUrl} className="text-action-link">查看投稿状态</Link> : null}
            <Link href="/souls" className="text-action-link">返回灵魂库</Link>
          </div>
        </section>
      </main>
    </>
  );
}
