import Link from 'next/link';
import type { Metadata } from 'next';

import { SiteHeader } from '@/components/site-header';
import { buildPageMetadata } from '@/lib/seo';
import { GITHUB_REPO_URL } from '@/lib/site-config';

export const metadata: Metadata = buildPageMetadata({
  title: '关于 ClawPlay',
  description: '了解 ClawPlay 为什么要先做 Soul 人格层、内容来源原则、投稿审核规则，以及联系与安全反馈方式。',
  pathname: '/about',
  keywords: ['关于 ClawPlay', '投稿规则', '来源与授权', '审核规则'],
});

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell prose-page about-page">
        <p className="eyebrow">关于 ClawPlay</p>
        <h1>这是一个 OpenClaw Soul 人格分享平台，不只是堆 <code>SOUL.md</code> 的目录页</h1>
        <p className="prose-page__lead">
          ClawPlay 想解决的不是“有没有 Soul”，而是“灵魂人格太散，看不清边界，也很难决定该不该替换进自己的龙虾”。所以它把零散的 <code>SOUL.md</code> 整理成一个可发现、可比较、可导入、可投稿的站点。
        </p>

        <section>
          <h2>ClawPlay 是什么</h2>
          <ul>
            <li>一个面向 OpenClaw 的中文 Soul preset / 人格分享平台。</li>
            <li>一个支持原文查看、下载、导入与投稿的分享入口。</li>
            <li>一个带人工审核与标签治理的内容整理平台。</li>
          </ul>
        </section>

        <section>
          <h2>ClawPlay 不是什么</h2>
          <ul>
            <li>不是自由生长的标签市场。</li>
            <li>不是付费 Soul 交易平台。</li>
            <li>不是已经完整打包好 Agent 镜像的一键市场。</li>
            <li>不是只追求数量、不看来源与授权的收录站。</li>
          </ul>
        </section>

        <section>
          <h2>来源与授权原则</h2>
          <ul>
            <li>原创、翻译、改编会分别标注来源类型。</li>
            <li>翻译 / 改编稿件至少需要原始来源链接，最好补充原作者信息。</li>
            <li>如果来源链路或授权情况不清楚，稿件可能不会进入正式发布。</li>
          </ul>
        </section>

        <section>
          <h2>投稿与审核规则</h2>
          <ul>
            <li>首稿优先看核心信息是否完整，支持直接上传 `.md` 文件。</li>
            <li>审核重点是内容是否可信、是否可导入、来源与授权是否清楚。</li>
            <li>用户可以提议新标签，但不会直接公开创建正式标签。</li>
            <li>如果需要补资料，会通过私密管理链接继续补，而不是要求一次写完。</li>
          </ul>
        </section>

        <section>
          <h2>官方仓库</h2>
          <p>
            ClawPlay 的官方 GitHub 仓库地址是
            {' '}
            <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" className="text-action-link">{GITHUB_REPO_URL}</a>
            。如果你是通过搜索来到这里，优先认这个地址即可。
          </p>
        </section>

        <section>
          <h2>联系与反馈</h2>
          <p>如果你想反馈问题、讨论方案或报告安全风险，可以使用下面这些入口：</p>
          <div className="prose-page__actions">
            <a href={`${GITHUB_REPO_URL}/issues`} target="_blank" rel="noreferrer" className="text-action-link">ClawPlay GitHub 仓库 Issues</a>
            <a href={`${GITHUB_REPO_URL}/discussions`} target="_blank" rel="noreferrer" className="text-action-link">ClawPlay GitHub 仓库 Discussions</a>
            <a href={`${GITHUB_REPO_URL}/blob/main/SECURITY.md`} target="_blank" rel="noreferrer" className="text-action-link">ClawPlay 安全反馈说明</a>
          </div>
        </section>

        <div className="prose-page__actions">
          <Link href="/souls" className="text-action-link">去逛灵魂库</Link>
          <Link href="/submit" className="text-action-link">分享我的 Soul preset</Link>
        </div>
      </main>
    </>
  );
}
