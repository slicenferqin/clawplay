import Link from 'next/link';
import type { Metadata } from 'next';

import { CopyButton } from '@/components/copy-button';
import { InstallCommand } from '@/components/install-command';
import { SiteHeader } from '@/components/site-header';
import { getBackupCommand } from '@/lib/install';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '导入说明',
  description: 'ClawPlay 导入说明包含备份、替换、下载、回滚与常见问题。先理解一个 Soul 的人格气质，再决定是否导入。',
  pathname: '/install',
  keywords: ['导入说明', '导入 Soul', '替换 SOUL.md', 'OpenClaw Soul preset', '回滚'],
});

export default function InstallPage() {
  const backupCommand = getBackupCommand();

  return (
    <>
      <SiteHeader />
      <main className="page-shell prose-page">
        <p className="eyebrow">导入指南</p>
        <h1>先理解这个灵魂，再决定要不要把它导入你的 OpenClaw</h1>
        <p className="prose-page__lead">
          ClawPlay 当前优先提供基于原始 SOUL 的 <code>curl</code> 导入方式，不额外包一层 CLI。目标不是把命令藏起来，而是让你先看清楚这是一种什么人格，再决定是否替换进本地，必要时也能轻松回滚。
        </p>

        <section>
          <h2>推荐方式：直接导入起始 Soul</h2>
          <p>详情页会按当前 Soul 自动生成命令。下面先用「猫娘 Nova」做一个示例：</p>
          <InstallCommand slug="catgirl-nova" codeClassName="command-block" />
          <div className="prose-page__actions">
            <InstallCommand slug="catgirl-nova" showCode={false} showCopyButton copyLabel="复制示例导入命令" />
            <Link href="/souls/catgirl-nova" className="text-action-link">先看这个人格</Link>
          </div>
          <ol>
            <li>确认你的 OpenClaw 正在读取本地 <code>~/.openclaw/workspace/SOUL.md</code>。</li>
            <li>在 Soul 详情页先看简介、标签、预览、边界和原文。</li>
            <li>确认适合后，再复制命令执行。</li>
            <li>执行完成后，重启 OpenClaw，再开一个新会话试用。</li>
          </ol>
        </section>

        <section>
          <h2>导入前，先记住这三件事</h2>
          <div className="prose-page__card-grid">
            <article className="prose-page__mini-card">
              <h3>先备份</h3>
              <p>导入前先留一份旧的 <code>SOUL.md</code>，回滚时会省很多事。</p>
            </article>
            <article className="prose-page__mini-card">
              <h3>先看人格</h3>
              <p>先看这个 Soul 的说话风格、适用场景和原文，不急着盲替换。</p>
            </article>
            <article className="prose-page__mini-card">
              <h3>不喜欢可回滚</h3>
              <p>如果试过不合适，直接把备份文件换回去就行，不需要复杂卸载流程。</p>
            </article>
          </div>
        </section>

        <section>
          <h2>先备份，再替换</h2>
          <p>推荐在覆盖前先备份一份旧灵魂，这样回滚最省心。</p>
          <code className="command-block">{backupCommand}</code>
          <div className="prose-page__actions">
            <CopyButton text={backupCommand} label="复制备份命令" />
          </div>
          <p className="prose-page__callout">建议把备份命令和导入命令连着执行。这样即使这次 Soul 不适合你，也能很快换回原来的工作状态。</p>
        </section>

        <section>
          <h2>手动替换</h2>
          <ol>
            <li>打开对应详情页，点击“查看原始 SOUL”或直接下载原文。</li>
            <li>确认内容无误后，复制原始文本。</li>
            <li>替换本地的 <code>SOUL.md</code> 并重启 OpenClaw。</li>
          </ol>
        </section>

        <section>
          <h2>常见问题</h2>
          <h3>为什么 ClawPlay 暂时不额外做一个导入 CLI？</h3>
          <p>当前阶段直接提供原始内容直链最稳，也最容易看清楚你实际导入本地的是什么人格 preset。</p>
          <h3>导入后不喜欢怎么办？</h3>
          <p>按上面的备份流程把旧文件换回去即可。ClawPlay 的导入说明会优先把“怎么撤回”说清楚。</p>
          <h3>我能先看原文再决定吗？</h3>
          <p>可以。每个 Soul 详情页都支持查看原文和下载原文，先看清楚再装更稳。</p>
        </section>

        <div className="prose-page__actions">
          <Link href="/souls" className="text-action-link">先去挑一个人格</Link>
          <Link href="/about" className="text-action-link">看看项目规则</Link>
        </div>
      </main>
    </>
  );
}
