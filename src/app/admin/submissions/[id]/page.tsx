import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { AdminDecisionForm } from '@/components/admin-decision-form';
import { SiteHeader } from '@/components/site-header';
import { SubmissionStatusBadge } from '@/components/submission-status-badge';
import { isAdminAuthenticated } from '@/lib/submissions/admin';
import { getSubmissionDetailForAdmin } from '@/lib/submissions/service';

export const dynamic = 'force-dynamic';

export default async function AdminSubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const detail = getSubmissionDetailForAdmin(id);
  if (!detail) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="page-shell admin-detail-page">
        <div className="breadcrumb-row">
          <Link href="/admin/submissions" className="text-action-link">返回审核列表</Link>
        </div>

        <section className="submission-status-header">
          <div>
            <p className="eyebrow">投稿详情</p>
            <h1 className="page-heading__title">{detail.submission.title}</h1>
            <p className="page-heading__description">{detail.submission.publicId} · {detail.submission.summary}</p>
          </div>
          <SubmissionStatusBadge status={detail.submission.status} />
        </section>

        <section className="admin-detail-layout">
          <div className="admin-detail-layout__main">
            <article className="detail-panel detail-panel--tinted">
              <h2 className="detail-panel__title detail-panel__title--small">审核操作</h2>
              <AdminDecisionForm submissionId={detail.submission.id} initialSlug={detail.submission.title} />
            </article>

            <article className="detail-panel">
              <h2 className="detail-panel__title detail-panel__title--small">展示信息</h2>
              <div className="detail-panel__columns">
                <div>
                  <h3 className="detail-panel__subheading">标签</h3>
                  <p className="detail-panel__body">{detail.submission.tags.join(' / ')}</p>
                </div>
                <div>
                  <h3 className="detail-panel__subheading">语气</h3>
                  <p className="detail-panel__body">{detail.submission.tones.join(' / ')}</p>
                </div>
                <div>
                  <h3 className="detail-panel__subheading">场景</h3>
                  <p className="detail-panel__body">{detail.submission.useCases.join(' / ')}</p>
                </div>
                <div>
                  <h3 className="detail-panel__subheading">兼容模型</h3>
                  <p className="detail-panel__body">{detail.submission.compatibleModels.join(' / ')}</p>
                </div>
              </div>
            </article>

            <article className="detail-panel">
              <h2 className="detail-panel__title detail-panel__title--small">预览内容</h2>
              <p className="detail-panel__body"><strong>预览钩子：</strong>{detail.submission.previewHook}</p>
              <p className="detail-panel__dialogue"><strong>示例 Prompt：</strong>{detail.submission.previewPrompt}</p>
              <p className="detail-panel__dialogue"><strong>示例 Response：</strong>{detail.submission.previewResponse}</p>
            </article>

            <article className="detail-panel">
              <h2 className="detail-panel__title detail-panel__title--small">原始 SOUL</h2>
              <pre className="raw-details__pre">{detail.submission.rawSoul}</pre>
            </article>
          </div>

          <aside className="admin-detail-layout__side">
            <article className="detail-panel detail-panel--side">
              <h2 className="detail-panel__title detail-panel__title--small">版权与联系</h2>
              <ul className="detail-panel__list detail-panel__list--compact">
                <li>投稿类型：{detail.submission.submissionType}</li>
                <li>作者：{detail.submission.authorName}</li>
                <li>协议：{detail.submission.license}</li>
                <li>联系方式：{detail.submission.contactMethod || '未提供'} {detail.submission.contactValue || ''}</li>
                <li>原作者：{detail.submission.sourceAuthor || '未提供'}</li>
                <li>来源：{detail.submission.sourceUrl || '未提供'}</li>
              </ul>
            </article>

            <article className="detail-panel detail-panel--side">
              <h2 className="detail-panel__title detail-panel__title--small">状态记录</h2>
              <ul className="timeline-list">
                {detail.statusLogs.map((log) => (
                  <li key={log.id}>
                    <strong>{log.toStatus}</strong>
                    <span>{new Date(log.createdAt).toLocaleString('zh-CN')}</span>
                    {log.note ? <p>{log.note}</p> : null}
                  </li>
                ))}
              </ul>
            </article>

            <article className="detail-panel detail-panel--side">
              <h2 className="detail-panel__title detail-panel__title--small">修订历史</h2>
              <ul className="timeline-list">
                {detail.revisions.map((revision) => (
                  <li key={revision.id}>
                    <strong>第 {revision.revisionNo} 版</strong>
                    <span>{new Date(revision.createdAt).toLocaleString('zh-CN')}</span>
                    <p>提交者：{revision.actorType === 'submitter' ? '投稿人' : '管理员'}</p>
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
