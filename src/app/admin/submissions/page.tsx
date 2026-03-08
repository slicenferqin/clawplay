import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SiteHeader } from '@/components/site-header';
import { SubmissionStatusBadge } from '@/components/submission-status-badge';
import { isAdminAuthenticated } from '@/lib/submissions/admin';
import { listSubmissions } from '@/lib/submissions/service';
import type { SubmissionStatus } from '@/lib/submissions/schema';

export const dynamic = 'force-dynamic';

export default async function AdminSubmissionsPage({ searchParams }: { searchParams: Promise<{ status?: SubmissionStatus; q?: string; page?: string }> }) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login?next=/admin/submissions');
  }

  const { status, q, page } = await searchParams;
  const result = listSubmissions({
    status,
    query: q,
    page: page ? Number.parseInt(page, 10) : 1,
    pageSize: 20,
  });

  return (
    <>
      <SiteHeader />
      <main className="page-shell admin-page">
        <section className="page-heading">
          <h1 className="page-heading__title">投稿审核队列</h1>
          <p className="page-heading__description">先把队列清楚、状态稳定、发布可靠，再谈更复杂的运营后台。</p>
        </section>

        <section className="toolbar-row admin-toolbar-row">
          <div className="admin-filter-pills">
            <Link href="/admin/submissions" className={!status ? 'is-active' : ''}>全部</Link>
            <Link href="/admin/submissions?status=pending_review" className={status === 'pending_review' ? 'is-active' : ''}>待审核</Link>
            <Link href="/admin/submissions?status=needs_revision" className={status === 'needs_revision' ? 'is-active' : ''}>待补充</Link>
            <Link href="/admin/submissions?status=approved" className={status === 'approved' ? 'is-active' : ''}>已通过</Link>
            <Link href="/admin/submissions?status=published" className={status === 'published' ? 'is-active' : ''}>已发布</Link>
            <Link href="/admin/submissions?status=rejected" className={status === 'rejected' ? 'is-active' : ''}>未采用</Link>
          </div>
          <span className="toolbar-row__sort">共 {result.total} 条</span>
        </section>

        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>状态</th>
                <th>标题</th>
                <th>类型</th>
                <th>作者</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.id}>
                  <td><SubmissionStatusBadge status={item.status} /></td>
                  <td>
                    <div className="admin-table__title">{item.title}</div>
                    <div className="admin-table__meta">{item.publicId}</div>
                  </td>
                  <td>{item.submissionType}</td>
                  <td>{item.authorName}</td>
                  <td>{new Date(item.createdAt).toLocaleString('zh-CN')}</td>
                  <td>
                    <Link href={`/admin/submissions/${item.id}`} className="text-action-link">查看详情</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
