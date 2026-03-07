import Link from 'next/link';

import { SiteHeader } from '@/components/site-header';

export default function SubmitPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell prose-page">
        <h1>投稿说明</h1>
        <p>当前版本先走轻量投稿流，不做开放式账号发布。优先保证内容质量、版权清晰和安装体验。</p>

        <section>
          <h2>投稿需要提供什么</h2>
          <ul>
            <li>人格名称和一句话简介</li>
            <li>适用场景、特色功能、使用建议</li>
            <li>原始 SOUL.md 内容</li>
            <li>作者信息、来源和协议</li>
          </ul>
        </section>

        <section>
          <h2>当前推荐方式</h2>
          <p>
            先通过 GitHub 仓库提交 PR，或者在仓库里开 Issue 说明投稿意向。后续如果内容量上来，再补网页表单和审核后台。
          </p>
        </section>

        <div className="prose-page__actions">
          <Link href="https://github.com/slicenferqin/clawplay" target="_blank" rel="noreferrer" className="text-action-link">
            打开 GitHub 仓库
          </Link>
          <Link href="/souls" className="text-action-link">
            先看现有灵魂
          </Link>
        </div>
      </main>
    </>
  );
}
