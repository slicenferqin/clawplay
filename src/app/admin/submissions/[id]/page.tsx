import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { AdminDecisionForm } from '@/components/admin-decision-form';
import { SiteHeader } from '@/components/site-header';
import { SubmissionStatusBadge } from '@/components/submission-status-badge';
import { CATEGORY_LABELS } from '@/lib/souls-types';
import { isAdminAuthenticated } from '@/lib/submissions/admin';
import { getSubmissionDetailForAdmin } from '@/lib/submissions/service';

export const dynamic = 'force-dynamic';

const actorLabels = {
  submitter: '投稿人',
  admin: '管理员',
  system: '系统',
} as const;

const contactMethodLabels = {
  github: 'GitHub',
  email: '邮箱',
  wechat: '微信',
  other: '其他',
} as const;

function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '—';
}

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

        <section className="admin-detail-hero">
          <div className="admin-detail-hero__main">
            <p className="eyebrow">投稿详情</p>
            <div className="admin-detail-hero__heading">
              <h1 className="page-heading__title">{detail.submission.title}</h1>
              <SubmissionStatusBadge status={detail.submission.status} />
            </div>
            <p className="page-heading__description">{detail.submission.publicId} · {detail.submission.summary}</p>
            <div className="detail-chip-list detail-chip-list--hero">
              <span className="tag-pill">{detail.submission.submissionType}</span>
              <span className="tag-pill">{CATEGORY_LABELS[detail.submission.category]}</span>
              <span className="tag-pill">作者：{detail.submission.authorName}</span>
              <span className="tag-pill">创建于 {formatTime(detail.submission.createdAt)}</span>
            </div>
          </div>

          <div className="admin-detail-hero__meta">
            <div className="admin-kpi-card admin-kpi-card--compact is-active">
              <span className="admin-kpi-card__label">提交时间</span>
              <strong className="admin-kpi-card__value admin-kpi-card__value--small">{formatTime(detail.submission.createdAt)}</strong>
              <span className="admin-kpi-card__hint">进入审核队列的时间点</span>
            </div>
            <div className="admin-kpi-card admin-kpi-card--compact">
              <span className="admin-kpi-card__label">最近审核</span>
              <strong className="admin-kpi-card__value admin-kpi-card__value--small">{formatTime(detail.submission.reviewedAt)}</strong>
              <span className="admin-kpi-card__hint">最后一次人工处理记录</span>
            </div>
            <div className="admin-kpi-card admin-kpi-card--compact">
              <span className="admin-kpi-card__label">发布时间</span>
              <strong className="admin-kpi-card__value admin-kpi-card__value--small">{formatTime(detail.submission.publishedAt)}</strong>
              <span className="admin-kpi-card__hint">只有发布后才会出现在站点</span>
            </div>
          </div>
        </section>

        <section className="admin-detail-layout">
          <div className="admin-detail-layout__main">
            <article className="detail-panel detail-panel--tinted">
              <div className="detail-panel__header">
                <div>
                  <p className="detail-panel__eyebrow">Review Workspace</p>
                  <h2 className="detail-panel__title detail-panel__title--small">审核工作台</h2>
                </div>
                <p className="detail-panel__body">把审核备注、状态流转与发布动作放在同一个工作区，减少来回切换和误操作。</p>
              </div>
              <AdminDecisionForm submissionId={detail.submission.id} initialSlug={detail.submission.title} />
            </article>

            <article className="detail-panel">
              <div className="detail-panel__header">
                <div>
                  <p className="detail-panel__eyebrow">Listing Content</p>
                  <h2 className="detail-panel__title detail-panel__title--small">展示信息</h2>
                </div>
                <p className="detail-panel__body">这些字段决定列表卡片、详情页与搜索结果的第一印象，适合在这里做一次内容质量判断。</p>
              </div>

              <div className="detail-chip-grid">
                <section className="detail-field">
                  <h3 className="detail-panel__subheading">标签</h3>
                  <div className="detail-chip-list">
                    {detail.submission.tags.map((tag) => <span key={tag} className="tag-pill">{tag}</span>)}
                  </div>
                </section>
                <section className="detail-field">
                  <h3 className="detail-panel__subheading">语气</h3>
                  <div className="detail-chip-list">
                    {detail.submission.tones.map((tone) => <span key={tone} className="tag-pill">{tone}</span>)}
                  </div>
                </section>
                <section className="detail-field">
                  <h3 className="detail-panel__subheading">场景</h3>
                  <div className="detail-chip-list">
                    {detail.submission.useCases.map((useCase) => <span key={useCase} className="tag-pill">{useCase}</span>)}
                  </div>
                </section>
                <section className="detail-field">
                  <h3 className="detail-panel__subheading">兼容模型</h3>
                  <div className="detail-chip-list">
                    {detail.submission.compatibleModels.map((model) => <span key={model} className="tag-pill">{model}</span>)}
                  </div>
                </section>
                <section className="detail-field detail-field--full">
                  <h3 className="detail-panel__subheading">简介</h3>
                  <p className="detail-panel__body">{detail.submission.intro}</p>
                </section>
                <section className="detail-field">
                  <h3 className="detail-panel__subheading">亮点</h3>
                  <ul className="detail-panel__list detail-panel__list--compact">
                    {detail.submission.features.map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                </section>
                <section className="detail-field">
                  <h3 className="detail-panel__subheading">使用建议</h3>
                  <ul className="detail-panel__list detail-panel__list--compact">
                    {detail.submission.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}
                  </ul>
                </section>
              </div>
            </article>

            <article className="detail-panel">
              <div className="detail-panel__header">
                <div>
                  <p className="detail-panel__eyebrow">Preview Pack</p>
                  <h2 className="detail-panel__title detail-panel__title--small">预览内容</h2>
                </div>
                <p className="detail-panel__body">把预览钩子、示例 Prompt 和示例 Response 拆开后，审核时更容易判断内容是否完整、是否足够吸引人。</p>
              </div>

              <div className="detail-callout-grid">
                <section className="detail-callout">
                  <h3 className="detail-panel__subheading">预览钩子</h3>
                  <p className="detail-panel__body">{detail.submission.previewHook}</p>
                </section>
                <section className="detail-callout">
                  <h3 className="detail-panel__subheading">示例 Prompt</h3>
                  <p className="detail-panel__dialogue">{detail.submission.previewPrompt}</p>
                </section>
                <section className="detail-callout detail-callout--full">
                  <h3 className="detail-panel__subheading">示例 Response</h3>
                  <p className="detail-panel__dialogue">{detail.submission.previewResponse}</p>
                </section>
              </div>
            </article>

            <article className="detail-panel">
              <div className="detail-panel__header">
                <div>
                  <p className="detail-panel__eyebrow">SOUL Source</p>
                  <h2 className="detail-panel__title detail-panel__title--small">原始 SOUL</h2>
                </div>
                <p className="detail-panel__body">保留完整原文，便于核对格式、语气和安装后真正会落到用户机器上的内容。</p>
              </div>
              <pre className="raw-details__pre">{detail.submission.rawSoul}</pre>
            </article>
          </div>

          <aside className="admin-detail-layout__side">
            <article className="detail-panel detail-panel--side">
              <div className="detail-panel__header">
                <div>
                  <p className="detail-panel__eyebrow">Ownership</p>
                  <h2 className="detail-panel__title detail-panel__title--small">版权与联系</h2>
                </div>
              </div>

              <dl className="detail-definition-list">
                <div>
                  <dt>投稿类型</dt>
                  <dd>{detail.submission.submissionType}</dd>
                </div>
                <div>
                  <dt>作者</dt>
                  <dd>{detail.submission.authorName}</dd>
                </div>
                <div>
                  <dt>协议</dt>
                  <dd>{detail.submission.license}</dd>
                </div>
                <div>
                  <dt>联系方式</dt>
                  <dd>
                    {detail.submission.contactMethod
                      ? `${contactMethodLabels[detail.submission.contactMethod]} · ${detail.submission.contactValue ?? '未填写'}`
                      : '未提供'}
                  </dd>
                </div>
                <div>
                  <dt>原作者</dt>
                  <dd>{detail.submission.sourceAuthor || '未提供'}</dd>
                </div>
                <div>
                  <dt>来源</dt>
                  <dd>
                    {detail.submission.sourceUrl ? (
                      <a href={detail.submission.sourceUrl} target="_blank" rel="noreferrer" className="text-action-link">
                        打开原始来源
                      </a>
                    ) : '未提供'}
                  </dd>
                </div>
              </dl>

              <div className="detail-note-stack">
                <section className="detail-note-card">
                  <h3 className="detail-panel__subheading">版权声明</h3>
                  <p className="detail-panel__body">{detail.submission.rightsStatement}</p>
                </section>
                {detail.submission.submitterNote ? (
                  <section className="detail-note-card">
                    <h3 className="detail-panel__subheading">投稿人备注</h3>
                    <p className="detail-panel__body">{detail.submission.submitterNote}</p>
                  </section>
                ) : null}
                {detail.submission.latestReviewerNote ? (
                  <section className="detail-note-card">
                    <h3 className="detail-panel__subheading">最近审核备注</h3>
                    <p className="detail-panel__body">{detail.submission.latestReviewerNote}</p>
                  </section>
                ) : null}
              </div>
            </article>

            <article className="detail-panel detail-panel--side">
              <div className="detail-panel__header">
                <div>
                  <p className="detail-panel__eyebrow">Status Trail</p>
                  <h2 className="detail-panel__title detail-panel__title--small">状态记录</h2>
                </div>
              </div>

              <ul className="timeline-list timeline-list--rich">
                {detail.statusLogs.map((log) => (
                  <li key={log.id}>
                    <div className="timeline-list__marker" aria-hidden="true" />
                    <div className="timeline-list__content">
                      <div className="timeline-list__status-pair">
                        {log.fromStatus ? <SubmissionStatusBadge status={log.fromStatus} /> : null}
                        {log.fromStatus ? <span className="timeline-list__arrow">→</span> : null}
                        <SubmissionStatusBadge status={log.toStatus} />
                      </div>
                      <span>{actorLabels[log.actorType]} · {formatTime(log.createdAt)}</span>
                      {log.note ? <p>{log.note}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <article className="detail-panel detail-panel--side">
              <div className="detail-panel__header">
                <div>
                  <p className="detail-panel__eyebrow">Revision Trail</p>
                  <h2 className="detail-panel__title detail-panel__title--small">修订历史</h2>
                </div>
              </div>

              <ul className="timeline-list timeline-list--rich">
                {detail.revisions.map((revision) => (
                  <li key={revision.id}>
                    <div className="timeline-list__marker" aria-hidden="true" />
                    <div className="timeline-list__content">
                      <strong>第 {revision.revisionNo} 版</strong>
                      <span>{actorLabels[revision.actorType]} · {formatTime(revision.createdAt)}</span>
                      <p>标题：{revision.payload.title}</p>
                    </div>
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
