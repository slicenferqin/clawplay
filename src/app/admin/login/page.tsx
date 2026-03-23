import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AdminLoginForm } from '@/components/admin-login-form';
import { SiteHeader } from '@/components/site-header';
import { buildNoIndexMetadata } from '@/lib/seo';
import { SITE_NAME } from '@/lib/site-config';
import { isAdminAuthenticated } from '@/lib/submissions/admin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildNoIndexMetadata({
  title: '管理员登录',
  description: `${SITE_NAME} 审核后台登录页不应被搜索引擎索引。`,
});

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect('/admin/submissions');
  }

  return (
    <>
      <SiteHeader />
      <main className="page-shell prose-page admin-login-page">
        <section className="detail-panel detail-panel--side admin-login-card">
          <p className="detail-panel__eyebrow">审核后台</p>
          <h1 className="detail-panel__title">管理员登录</h1>
          <p className="detail-panel__body">这是一套极简审核后台，只服务投稿闭环，不公开给普通用户。</p>
          <AdminLoginForm />
        </section>
      </main>
    </>
  );
}
