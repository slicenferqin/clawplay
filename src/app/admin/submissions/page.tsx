import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SiteHeader } from '@/components/site-header';
import { SubmissionStatusBadge } from '@/components/submission-status-badge';
import { CATEGORY_LABELS } from '@/lib/souls-types';
import { isAdminAuthenticated } from '@/lib/submissions/admin';
import { getSubmissionStatusSummary, listSubmissions } from '@/lib/submissions/service';
import type { SubmissionStatus } from '@/lib/submissions/schema';

export const dynamic = 'force-dynamic';

const statusOptions: Array<{ value?: SubmissionStatus; label: string; description: string }> = [
  { label: '全部', description: '看整体队列节奏与体量' },
  { value: 'pending_review', label: '待审核', description: '优先清空主队列' },
  { value: 'needs_revision', label: '待补充', description: '跟进作者反馈' },
  { value: 'approved', label: '已通过', description: '等待最终发布' },
  { value: 'published', label: '已发布', description: '已经进入站点' },
  { value: 'rejected', label: '未采用', description: '保留归档记录' },
];

function buildAdminSubmissionsHref(filters: { status?: SubmissionStatus; q?: string; page?: number }) {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.q?.trim()) {
    params.set('q', filters.q.trim());
  }

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }

  const query = params.toString();
  return query ? `/admin/submissions?${query}` : '/admin/submissions';
}

export default async function AdminSubmissionsPage({ searchParams }: { searchParams: Promise<{ status?: SubmissionStatus; q?: string; page?: string }> }) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login?next=/admin/submissions');
  }

  const { status, q, page } = await searchParams;
  const query = q?.trim() ?? '';
  const currentPage = page ? Number.parseInt(page, 10) : 1;
  const result = listSubmissions({
    status,
    query,
    page: currentPage,
    pageSize: 20,
  });
  const summary = getSubmissionStatusSummary();
  const activeFilter = statusOptions.find((option) => option.value === status) ?? statusOptions[0];
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
              这块不是堆功能，而是把队列、审核动作与信息密度整理顺，让管理员能更快判断：先看什么、先处理什么、哪些稿件可以直接发布。
            </p>
            <div className="admin-hero__meta-strip" aria-label="当前审核状态摘要">
              <span className="admin-meta-pill">
                当前队列
                <strong>{status ? summary.counts[status] : summary.total}</strong>
              </span>
              <span className="admin-meta-pill">
                当前筛选
                <strong>{activeFilter.label}</strong>
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
            const count = option.value ? summary.counts[option.value] : summary.total;
            const href = buildAdminSubmissionsHref({ status: option.value, q: query || undefined });
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

        <section className="admin-tools-card">
          <div className="admin-tools-card__top">
            <div>
              <h2 className="admin-tools-card__title">筛选与检索</h2>
              <p className="admin-tools-card__description">先清理待审核，再回看需要补充与已发布记录，避免在同一张表里来回跳读。</p>
            </div>
            <span className="toolbar-row__sort">当前显示 {result.total} 条</span>
          </div>

          <div className="admin-filter-pills">
            {statusOptions.map((option) => {
              const href = buildAdminSubmissionsHref({ status: option.value, q: query || undefined });
              const isActive = option.value === status || (!option.value && !status);

              return (
                <Link key={option.label} href={href} className={isActive ? 'is-active' : ''}>
                  {option.label}
                </Link>
              );
            })}
          </div>

          <form action="/admin/submissions" className="admin-search-form">
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <label className="admin-search-form__field">
              <span className="admin-search-form__label">搜索标题、作者或投稿编号</span>
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
              {(status || query) ? (
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
              <h2 className="admin-table-card__title">投稿列表</h2>
              <p className="admin-table-card__description">把摘要、编号与时间线放在一处，列表页就能先完成一轮粗筛，不必每条都点进去。</p>
            </div>
          </div>

          {result.items.length === 0 ? (
            <div className="empty-state admin-empty-state">
              <p>当前筛选条件下没有匹配的投稿。</p>
              <Link href="/admin/submissions">回到完整审核队列</Link>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>状态</th>
                  <th>标题与摘要</th>
                  <th>类型</th>
                  <th>作者</th>
                  <th>提交时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <SubmissionStatusBadge status={item.status} />
                    </td>
                    <td>
                      <div className="admin-table__cell-stack">
                        <div className="admin-table__title">{item.title}</div>
                        <div className="admin-table__summary">{item.summary}</div>
                        <div className="admin-table__meta-row">
                          <span>{item.publicId}</span>
                          <span>{CATEGORY_LABELS[item.category]}</span>
                        </div>
                      </div>
                    </td>
                    <td>{item.submissionType}</td>
                    <td>{item.authorName}</td>
                    <td>
                      <div className="admin-table__time">{new Date(item.createdAt).toLocaleString('zh-CN')}</div>
                    </td>
                    <td>
                      <Link href={`/admin/submissions/${item.id}`} className="text-action-link admin-table__row-link">查看详情</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {totalPages > 1 ? (
            <div className="admin-pagination">
              <span className="admin-pagination__meta">第 {result.page} / {totalPages} 页</span>
              <div className="admin-pagination__actions">
                {result.page > 1 ? (
                  <Link href={buildAdminSubmissionsHref({ status, q: query || undefined, page: result.page - 1 })} className="submission-form__secondary admin-pagination__link">
                    上一页
                  </Link>
                ) : null}
                {result.page < totalPages ? (
                  <Link href={buildAdminSubmissionsHref({ status, q: query || undefined, page: result.page + 1 })} className="submission-form__secondary admin-pagination__link">
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
