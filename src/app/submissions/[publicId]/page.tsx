import type { Metadata } from 'next';
import Link from 'next/link';

import { AnalyticsViewTracker } from '@/components/analytics-view-tracker';
import { SiteHeader } from '@/components/site-header';
import { SoulSubmissionForm, type SubmissionFormValues } from '@/components/soul-submission-form';
import { SubmissionStatusBadge } from '@/components/submission-status-badge';
import { CATEGORY_LABELS } from '@/lib/souls-types';
import { buildNoIndexMetadata } from '@/lib/seo';
import { getPublicSubmissionView } from '@/lib/submissions/service';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildNoIndexMetadata({
  title: '投稿状态',
  description: '投稿状态页包含私密信息和管理令牌，不应被搜索引擎索引。',
});

function createInitialValues(view: NonNullable<ReturnType<typeof getPublicSubmissionView>>['submission']): SubmissionFormValues {
  return {
    submissionType: view.submissionType,
    title: view.title,
    summary: view.summary,
    category: view.category,
    tags: view.tags.join('\n'),
    tones: view.tones.join('\n'),
    useCases: view.useCases.join('\n'),
    compatibleModels: view.compatibleModels.join('\n'),
    previewHook: view.previewHook,
    previewPrompt: view.previewPrompt,
    previewResponse: view.previewResponse,
    intro: view.intro,
    features: view.features.join('\n'),
    suggestions: view.suggestions.join('\n'),
    rawSoul: view.rawSoul,
    authorName: view.authorName,
    contactMethod: view.contactMethod ?? '',
    contactValue: view.contactValue ?? '',
    license: view.license,
    sourceUrl: view.sourceUrl ?? '',
    sourceAuthor: view.sourceAuthor ?? '',
    rightsStatement: view.rightsStatement,
    submitterNote: view.submitterNote ?? '',
    website: '',
  };
}

export default async function SubmissionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { publicId } = await params;
  const { token = '' } = await searchParams;
  const view = token ? getPublicSubmissionView(publicId, token) : null;

  if (!view) {
    return (
      <>
        <SiteHeader />
        <main className="page-shell prose-page">
          <section className="detail-panel detail-panel--side">
            <h1 className="detail-panel__title detail-panel__title--small">这条管理链接无效或已失效</h1>
            <p className="detail-panel__body">请确认链接是否完整。如果你是在成功页复制的链接，尽量不要手动删掉 token 参数。</p>
            <div className="detail-panel__actions">
              <Link href="/submit" className="text-action-link">返回投稿页</Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="page-shell prose-page submission-status-page">
        <AnalyticsViewTracker
          eventName="submission_status_view"
          source="submission_status"
          placement="status_page"
          storageKey={`submission_status_view:${publicId}`}
        />

        <section className="submission-status-header">
          <div>
            <p className="eyebrow">投稿状态</p>
            <h1 className="page-heading__title">{view.submission.title}</h1>
            <p className="page-heading__description">编号：{view.submission.publicId} · 当前正在这条私密链接下跟踪。</p>
          </div>
          <SubmissionStatusBadge status={view.submission.status} />
        </section>

        <section className="submission-status-layout">
          <div className="submission-status-layout__main">
            <article className="detail-panel detail-panel--tinted">
              <h2 className="detail-panel__title detail-panel__title--small">最近一次审核备注</h2>
              <p className="detail-panel__body">{view.submission.latestReviewerNote || '目前还没有审核备注，耐心等一等。'}</p>
            </article>

            {view.submission.status === 'needs_revision' ? (
              <section className="submission-status-edit">
                <div className="submission-form__section-header">
                  <h2>补充资料后重新提交</h2>
                  <p>把审核里指出的问题改掉，再提交一版即可。提交后状态会自动回到“待审核”。</p>
                </div>
                <SoulSubmissionForm
                  mode="revision"
                  publicId={publicId}
                  manageToken={token}
                  initialValues={createInitialValues(view.submission)}
                />
              </section>
            ) : null}
          </div>

          <aside className="submission-status-layout__side">
            <article className="detail-panel detail-panel--side">
              <h2 className="detail-panel__title detail-panel__title--small">投稿摘要</h2>
              <p className="detail-panel__body">{view.submission.summary}</p>
              <ul className="detail-panel__list detail-panel__list--compact">
                <li>类型：{view.submission.submissionType}</li>
                <li>分类：{CATEGORY_LABELS[view.submission.category]}</li>
                <li>作者：{view.submission.authorName}</li>
                <li>协议：{view.submission.license}</li>
              </ul>
            </article>

            <article className="detail-panel detail-panel--side">
              <h2 className="detail-panel__title detail-panel__title--small">状态记录</h2>
              <ul className="timeline-list">
                {view.statusLogs.map((log) => (
                  <li key={log.id}>
                    <strong>{log.toStatus}</strong>
                    <span>{new Date(log.createdAt).toLocaleString('zh-CN')}</span>
                    {log.note ? <p>{log.note}</p> : null}
                  </li>
                ))}
              </ul>
            </article>
          </aside>
        </section>
      </main>
    </>
  );
}
