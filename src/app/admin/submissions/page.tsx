import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SiteHeader } from '@/components/site-header';
import { SubmissionStatusBadge } from '@/components/submission-status-badge';
import { CATEGORY_LABELS } from '@/lib/souls-types';
import { isAdminAuthenticated } from '@/lib/submissions/admin';
import {
  adminQuickViews,
  listAdminQueue,
  type AdminQuickView,
} from '@/lib/submissions/review-queue';
import { buildNoIndexMetadata } from '@/lib/seo';
import { getSubmissionStatusSummary, getSubmissionTypeSummary } from '@/lib/submissions/service';
import type { ContactMethod, SubmissionStatus, SubmissionType } from '@/lib/submissions/schema';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildNoIndexMetadata({
  title: '投稿审核队列',
  description: 'ClawPlay 审核后台队列页不应被搜索引擎索引。',
});

const statusOptions: Array<{ value?: SubmissionStatus; label: string; description: string }> = [
  { label: '全部', description: '看整体队列节奏与体量' },
  { value: 'pending_review', label: '待审核', description: '优先清空主队列' },
  { value: 'needs_revision', label: '待补充', description: '跟进作者反馈' },
  { value: 'approved', label: '已通过', description: '等待最终发布' },
  { value: 'published', label: '已发布', description: '已经进入站点' },
  { value: 'rejected', label: '未采用', description: '保留归档记录' },
];

const sourceOptions: Array<{ value?: SubmissionType; label: string; description: string }> = [
  { label: '全部来源', description: '一起看全量队列' },
  { value: '原创', label: '原创', description: '重点核对作者与协议' },
  { value: '翻译', label: '翻译', description: '优先核对来源与授权' },
  { value: '改编', label: '改编', description: '重点看改动边界与来源' },
];

const quickViewOptions: Array<{ value: AdminQuickView; label: string; description: string; tone: 'neutral' | 'critical' | 'warning' | 'ready' }> = [
  { value: 'all', label: '全部队列', description: '按审核优先级查看完整队列。', tone: 'neutral' },
  { value: 'missing_source', label: '只看缺来源', description: '优先处理翻译 / 改编里还没附来源的稿件。', tone: 'critical' },
  { value: 'blocking', label: '只看阻断项', description: '先清掉会卡住发布的硬性问题。', tone: 'warning' },
  { value: 'ready_to_publish', label: '只看待发布', description: '通过审核且已满足发布门槛的稿件。', tone: 'ready' },
];

const validQuickViews = new Set<AdminQuickView>(adminQuickViews);

const contactMethodLabels: Record<ContactMethod, string> = {
  github: 'GitHub',
  email: '邮箱',
  wechat: '微信',
  other: '其他',
};

function buildAdminSubmissionsHref(filters: {
  status?: SubmissionStatus;
  submissionType?: SubmissionType;
  q?: string;
  page?: number;
  view?: AdminQuickView;
}) {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.submissionType) {
    params.set('submissionType', filters.submissionType);
  }

  if (filters.q?.trim()) {
    params.set('q', filters.q.trim());
  }

  if (filters.view && filters.view !== 'all') {
    params.set('view', filters.view);
  }

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }

  const query = params.toString();
  return query ? `/admin/submissions?${query}` : '/admin/submissions';
}

function getQuickViewCount(
  summary: { total: number; missingSource: number; blocking: number; readyToPublish: number },
  view: AdminQuickView,
) {
  switch (view) {
    case 'missing_source':
      return summary.missingSource;
    case 'blocking':
      return summary.blocking;
    case 'ready_to_publish':
      return summary.readyToPublish;
    case 'all':
    default:
      return summary.total;
  }
}

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN');
}

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: SubmissionStatus; submissionType?: SubmissionType; q?: string; page?: string; view?: string }>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login?next=/admin/submissions');
  }

  const { status, submissionType, q, page, view } = await searchParams;
  const query = q?.trim() ?? '';
  const currentPage = page ? Number.parseInt(page, 10) : 1;
  const activeQuickView = view && validQuickViews.has(view as AdminQuickView) ? (view as AdminQuickView) : 'all';
  const result = listAdminQueue({
    status,
    submissionType,
    query,
    view: activeQuickView,
    page: currentPage,
    pageSize: 20,
  });
  const statusSummary = getSubmissionStatusSummary();
  const sourceSummary = getSubmissionTypeSummary();
  const activeStatusFilter = statusOptions.find((option) => option.value === status) ?? statusOptions[0];
  const activeSourceFilter = sourceOptions.find((option) => option.value === submissionType) ?? sourceOptions[0];
  const activeQuickViewFilter = quickViewOptions.find((option) => option.value === activeQuickView) ?? quickViewOptions[0];
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <>
      <SiteHeader />
      <main className="page-shell admin-page">
        <section className="admin-hero admin-hero--single">
          <div className="admin-hero__content">
            <p className="eyebrow">审核后台</p>
            <h1 className="page-heading__title">投稿审核队列</h1>
            <p className="page-heading__description">
              这版后台不再只是“能看列表”，而是把审核顺序明确出来：先补来源，再清阻断项，最后把已满足条件的稿件推进到发布。
            </p>
            <div className="admin-hero__meta-strip" aria-label="当前审核状态摘要">
              <span className="admin-meta-pill">
                当前结果
                <strong>{result.total}</strong>
              </span>
              <span className="admin-meta-pill">
                快捷视图
                <strong>{activeQuickViewFilter.label}</strong>
              </span>
              <span className="admin-meta-pill">
                来源缺口
                <strong>{result.summary.missingSource}</strong>
              </span>
              <span className="admin-meta-pill">
                待发布
                <strong>{result.summary.readyToPublish}</strong>
              </span>
              <span className="admin-meta-pill">
                检索条件
                <strong>{query || '未设置'}</strong>
              </span>
            </div>
          </div>
        </section>

        <section className="admin-kpi-grid" aria-label="投稿状态概览">
          {statusOptions.map((option) => {
            const count = option.value ? statusSummary.counts[option.value] : statusSummary.total;
            const href = buildAdminSubmissionsHref({
              status: option.value,
              submissionType,
              q: query || undefined,
              view: activeQuickView,
            });
            const isActive = option.value === status || (!option.value && !status);

            return (
              <Link key={option.label} href={href} className={`admin-kpi-card admin-kpi-card--compact${isActive ? ' is-active' : ''}`}>
                <span className="admin-kpi-card__label">{option.label}</span>
                <strong className="admin-kpi-card__value">{count}</strong>
                <span className="admin-kpi-card__hint">{option.description}</span>
              </Link>
            );
          })}
        </section>

        <section className="admin-queue-grid" aria-label="审核快捷视图">
          {quickViewOptions.map((option) => {
            const href = buildAdminSubmissionsHref({
              status,
              submissionType,
              q: query || undefined,
              view: option.value,
            });
            const isActive = option.value === activeQuickView;
            const count = getQuickViewCount(result.summary, option.value);

            return (
              <Link key={option.value} href={href} className={`admin-queue-card is-${option.tone}${isActive ? ' is-active' : ''}`}>
                <span className="admin-queue-card__label">{option.label}</span>
                <strong className="admin-queue-card__value">{count}</strong>
                <span className="admin-queue-card__hint">{option.description}</span>
              </Link>
            );
          })}
        </section>

        <section className="admin-tools-card">
          <div className="admin-tools-card__top">
            <div>
              <h2 className="admin-tools-card__title">筛选与检索</h2>
              <p className="admin-tools-card__description">先按状态收口，再用快捷视图做优先级切片，列表默认已经按审核优先级排序。</p>
            </div>
            <span className="toolbar-row__sort">默认排序：缺来源 &gt; 阻断项 &gt; 待发布</span>
          </div>

          <div className="admin-filter-groups">
            <div className="admin-filter-group">
              <span className="admin-filter-group__label">按状态</span>
              <div className="admin-filter-pills">
                {statusOptions.map((option) => {
                  const href = buildAdminSubmissionsHref({
                    status: option.value,
                    submissionType,
                    q: query || undefined,
                    view: activeQuickView,
                  });
                  const isActive = option.value === status || (!option.value && !status);

                  return (
                    <Link key={option.label} href={href} className={isActive ? 'is-active' : ''}>
                      {option.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="admin-filter-group">
              <span className="admin-filter-group__label">按来源</span>
              <div className="admin-filter-pills">
                {sourceOptions.map((option) => {
                  const count = option.value ? sourceSummary.counts[option.value] : sourceSummary.total;
                  const href = buildAdminSubmissionsHref({
                    status,
                    submissionType: option.value,
                    q: query || undefined,
                    view: activeQuickView,
                  });
                  const isActive = option.value === submissionType || (!option.value && !submissionType);

                  return (
                    <Link key={option.label} href={href} className={isActive ? 'is-active' : ''}>
                      {option.label} · {count}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <form action="/admin/submissions" className="admin-search-form">
            {status ? <input type="hidden" name="status" value={status} /> : null}
            {submissionType ? <input type="hidden" name="submissionType" value={submissionType} /> : null}
            {activeQuickView !== 'all' ? <input type="hidden" name="view" value={activeQuickView} /> : null}
            <label className="admin-search-form__field">
              <span className="admin-search-form__label">搜索标题、作者、摘要、投稿编号</span>
              <input
                type="search"
                name="q"
                defaultValue={query}
                className="submission-form__input"
                placeholder="例如：御用谋士 / 暴躁老王 / sub_abcd1234"
              />
            </label>
            <div className="admin-search-form__actions">
              <button type="submit" className="submission-form__submit admin-search-form__submit">搜索投稿</button>
              {(status || submissionType || query || activeQuickView !== 'all') ? (
                <Link href="/admin/submissions" className="submission-form__secondary admin-search-form__reset">
                  清空条件
                </Link>
              ) : null}
            </div>
          </form>
        </section>

        <section className="admin-table-card">
          <div className="admin-table-card__header">
            <div>
              <h2 className="admin-table-card__title">审核队列</h2>
              <p className="admin-table-card__description">每张卡片都带上优先级、来源状态与内容风险，管理员不需要点进详情也能先做一轮判断。</p>
            </div>
          </div>

          {result.items.length === 0 ? (
            <div className="empty-state admin-empty-state">
              <p>当前筛选条件下没有匹配的投稿。</p>
              <Link href="/admin/submissions">回到完整审核队列</Link>
            </div>
          ) : (
            <div className="admin-review-list">
              {result.items.map(({ submission, insight }) => {
                const authorLine = submission.contactMethod
                  ? `${contactMethodLabels[submission.contactMethod]} · ${submission.contactValue ?? '未填写'}`
                  : '未提供联系方式';

                return (
                  <article key={submission.id} className={`admin-review-card is-${insight.priorityTone}`}>
                    <div className="admin-review-card__top">
                      <div className="admin-review-card__badges">
                        <SubmissionStatusBadge status={submission.status} />
                        <span className={`admin-review-card__priority is-${insight.priorityTone}`}>{insight.priorityLabel}</span>
                        <span className={`admin-table__signal is-${insight.sourceState.tone}`}>{insight.sourceState.label}</span>
                      </div>
                      <Link href={`/admin/submissions/${submission.id}`} className="text-action-link admin-table__row-link">查看详情</Link>
                    </div>

                    <div className="admin-review-card__content">
                      <h3 className="admin-review-card__title">{submission.title}</h3>
                      <p className="admin-review-card__summary">{submission.summary}</p>
                      <div className="admin-review-card__meta">
                        <span>{submission.publicId}</span>
                        <span>{CATEGORY_LABELS[submission.category]}</span>
                        <span>{submission.submissionType}</span>
                        <span>作者：{submission.authorName}</span>
                        <span>联系方式：{authorLine}</span>
                        <span>提交于 {formatTime(submission.createdAt)}</span>
                      </div>
                      <div className="admin-review-card__stats">
                        <span className="admin-review-card__stat">阻断 {insight.blockingCount}</span>
                        <span className="admin-review-card__stat">警告 {insight.warningCount}</span>
                        <span className="admin-review-card__stat">通过 {insight.passCount}</span>
                      </div>
                    </div>

                    <div className="admin-review-card__signals">
                      <section className="admin-review-card__signal">
                        <span className="admin-review-card__signal-label">下一步</span>
                        <strong>{insight.priorityDescription}</strong>
                        <p>{insight.nextStep}</p>
                      </section>

                      <section className="admin-review-card__signal">
                        <span className="admin-review-card__signal-label">来源判断</span>
                        <strong>{insight.sourceState.label}</strong>
                        <p>
                          {submission.submissionType !== '原创' && submission.sourceUrl ? (
                            <a href={submission.sourceUrl} target="_blank" rel="noreferrer" className="text-action-link detail-source-link">
                              {submission.sourceUrl}
                            </a>
                          ) : (
                            insight.sourceState.description
                          )}
                        </p>
                      </section>

                      <section className="admin-review-card__signal">
                        <span className="admin-review-card__signal-label">风险摘要</span>
                        <strong>{insight.riskSummary}</strong>
                        <p>
                          {insight.blockerLabels.length > 0
                            ? `当前阻断项：${insight.blockerLabels.slice(0, 2).join('、')}`
                            : insight.readyForPublish
                              ? '内容检查已过线，可以继续推进发布动作。'
                              : '当前没有硬阻断，适合继续做人工判断。'}
                        </p>
                      </section>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="admin-pagination">
              <span className="admin-pagination__meta">第 {result.page} / {totalPages} 页</span>
              <div className="admin-pagination__actions">
                {result.page > 1 ? (
                  <Link
                    href={buildAdminSubmissionsHref({
                      status,
                      submissionType,
                      q: query || undefined,
                      view: activeQuickView,
                      page: result.page - 1,
                    })}
                    className="submission-form__secondary admin-pagination__link"
                  >
                    上一页
                  </Link>
                ) : null}
                {result.page < totalPages ? (
                  <Link
                    href={buildAdminSubmissionsHref({
                      status,
                      submissionType,
                      q: query || undefined,
                      view: activeQuickView,
                      page: result.page + 1,
                    })}
                    className="submission-form__secondary admin-pagination__link"
                  >
                    下一页
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </>
  );
}
