import Link from 'next/link';

import { CopyButton } from '@/components/copy-button';
import { InstallCommand } from '@/components/install-command';
import { SiteHeader } from '@/components/site-header';
import { getBackupCommand } from '@/lib/install';

export default function InstallPage() {
  const backupCommand = getBackupCommand();

  return (
    <>
      <SiteHeader />
      <main className="page-shell prose-page">
        <h1>安装说明</h1>
        <p>ClawPlay 当前优先提供基于原始 SOUL 的 <code>curl</code> 安装方式，不额外包一层 CLI。</p>

        <section>
          <h2>推荐方式：直接拉取原始 SOUL</h2>
          <p>详情页会按当前 soul 自动生成命令。下面先用「猫娘 Nova」做一个示例：</p>
          <InstallCommand slug="catgirl-nova" codeClassName="command-block" />
          <div className="prose-page__actions">
            <InstallCommand slug="catgirl-nova" showCode={false} showCopyButton copyLabel="复制示例命令" />
          </div>
          <ol>
            <li>确认你的 OpenClaw 正在读取本地 <code>~/.openclaw/workspace/SOUL.md</code>。</li>
            <li>在 soul 详情页复制命令并执行。</li>
            <li>执行完成后，重启 OpenClaw，再开一个新会话试用。</li>
          </ol>
        </section>

        <section>
          <h2>先备份，再覆盖</h2>
          <p>推荐在覆盖前先备份一份旧灵魂，这样回滚最省心。</p>
          <code className="command-block">{backupCommand}</code>
          <div className="prose-page__actions">
            <CopyButton text={backupCommand} label="复制备份命令" />
          </div>
        </section>

        <section>
          <h2>手动安装</h2>
          <ol>
            <li>打开对应详情页，进入“查看原始 SOUL”。</li>
            <li>确认内容无误后，复制原始文本。</li>
            <li>替换本地的 <code>SOUL.md</code> 并重启 OpenClaw。</li>
          </ol>
        </section>

        <section>
          <h2>建议</h2>
          <ul>
            <li>先在非关键工作会话里试用，再放进主工作流。</li>
            <li>如果一个 soul 很有趣但不稳定，先从轻任务开始适配。</li>
            <li>站点命令默认按当前域名生成；上线后只要域名稳定，复制体验就会自然成立。</li>
          </ul>
        </section>

        <Link href="/souls" className="text-action-link">
          先去挑一个灵魂
        </Link>
      </main>
    </>
  );
}
