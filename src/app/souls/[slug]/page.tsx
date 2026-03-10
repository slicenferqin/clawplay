import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AnalyticsViewTracker } from '@/components/analytics-view-tracker';
import { CopyButton } from '@/components/copy-button';
import { PersonaFitPanel } from '@/components/persona-fit-panel';
import { PersonaProfile } from '@/components/persona-profile';
import { PersonaAnalysisPanel } from '@/components/persona-analysis-panel';
import { ArrowRightIcon, DownloadIcon } from '@/components/icons';
import { InstallCommand } from '@/components/install-command';
import { SiteHeader } from '@/components/site-header';
import { SoulPackPanel } from '@/components/soul-pack-panel';
import { getBackupCommand, getRawSoulPath } from '@/lib/install';
import { buildPersonaProfile } from '@/lib/persona/profile';
import { buildSoulPackManifest } from '@/lib/soul-pack/service';
import { buildNoIndexMetadata, buildSoulMetadata } from '@/lib/seo';
import { getAllSouls, getRelatedSouls, getSoulBySlug } from '@/lib/souls';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  const souls = await getAllSouls();
  return souls.map((soul) => ({ slug: soul.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const soul = await getSoulBySlug(slug);

  if (!soul) {
    return buildNoIndexMetadata({
      title: 'Soul 不存在',
      description: '你访问的 Soul 可能还未收录，或 slug 已发生变化。',
    });
  }

  return buildSoulMetadata(soul);
}

export default async function SoulDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const soul = await getSoulBySlug(slug);

  if (!soul) {
    notFound();
  }

  const relatedSouls = await getRelatedSouls(soul.slug);
  const backupCommand = getBackupCommand();
  const personaProfile = buildPersonaProfile(soul);
  const soulPackManifest = buildSoulPackManifest(soul);
  const rawSoulUrl = getRawSoulPath(soul.slug, {
    source: 'soul_detail',
    placement: 'header_raw_link',
  });
  const rawSoulDownloadUrl = getRawSoulPath(soul.slug, {
    download: true,
    source: 'soul_detail_raw_panel',
    placement: 'inline_download',
  });
  const sidebarRawSoulUrl = getRawSoulPath(soul.slug, {
    source: 'soul_detail_raw_panel',
    placement: 'sidebar_raw_link',
  });
  const sidebarRawSoulDownloadUrl = getRawSoulPath(soul.slug, {
    download: true,
    source: 'soul_detail_raw_panel',
    placement: 'sidebar_download',
  });

  return (
    <>
      <SiteHeader />
      <main className="page-shell detail-page">
        <AnalyticsViewTracker
          eventName="soul_detail_view"
          slug={soul.slug}
          source="soul_detail"
          placement="page_view"
          storageKey={`soul_detail_view:${soul.slug}`}
        />

        <p className="breadcrumb">灵魂人格库 / {soul.categoryLabel} / {soul.title}</p>

        <section className="detail-heading">
          <div className="detail-heading__content">
            <h1 className="detail-heading__title">{soul.title}</h1>
            <p className="detail-heading__description">{soul.summary}</p>
            <p className="detail-heading__meta">
              标签：{soul.tags.join(' / ')} &nbsp;&nbsp; 作者：{soul.author} &nbsp;&nbsp; 协议：{soul.license}
              &nbsp;&nbsp; 更新：{soul.updatedAt}
            </p>
          </div>
          <div className="detail-heading__actions">
            <InstallCommand
              slug={soul.slug}
              showCode={false}
              showCopyButton
              copyLabel="复制导入命令"
              analyticsEventName="detail_install_copy"
              analyticsSource="soul_detail"
              analyticsPlacement="header_install"
            />
            <a href={rawSoulUrl} className="text-action-link">
              <span>查看原始 SOUL</span>
              <ArrowRightIcon className="text-action-link__icon" />
            </a>
          </div>
        </section>

        <section className="detail-layout">
          <div className="detail-layout__main">
            <article className="detail-panel detail-panel--tinted">
              <p className="detail-panel__eyebrow">人格预览</p>
              <h2 className="detail-panel__title">{soul.previewHook}</h2>
              <p className="detail-panel__body">
                适合场景：{soul.useCases.join('、')}。语气偏向 {soul.tones.join(' / ')}，兼容 {soul.compatibleModels.join('、')}。
              </p>
            </article>

            <PersonaProfile soul={soul} profile={personaProfile} />
            <PersonaFitPanel profile={personaProfile} />
            {soul.personaAnalysis ? <PersonaAnalysisPanel analysis={soul.personaAnalysis} /> : null}

            <article className="detail-panel">
              <h2 className="detail-panel__title detail-panel__title--small">示例对话与行为预期</h2>
              <p className="detail-panel__dialogue">
                <strong>用户：</strong>
                {soul.previewPrompt}
              </p>
              <p className="detail-panel__dialogue">
                <strong>{soul.title}：</strong>
                {soul.previewResponse}
              </p>
              <div className="detail-panel__columns">
                <div>
                  <h3 className="detail-panel__subheading">这个灵魂擅长什么</h3>
                  <ul className="detail-panel__list">
                    {soul.features.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="detail-panel__subheading">导入前建议</h3>
                  <ul className="detail-panel__list">
                    {soul.suggestions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <details className="raw-details">
              <summary className="raw-details__summary">
                <span className="raw-details__summary-main">
                  <ArrowRightIcon className="raw-details__summary-icon" />
                  <span>展开查看原始 SOUL.md</span>
                </span>
                <span className="raw-details__summary-note">导入前先核对结构</span>
              </summary>
              <div className="raw-details__actions">
                <CopyButton
                  text={soul.rawSoul}
                  label="复制原文"
                  analyticsEventName="detail_raw_copy"
                  analyticsSource="soul_detail_raw_panel"
                  analyticsPlacement="inline_raw_copy"
                  analyticsSlug={soul.slug}
                />
                <a href={rawSoulDownloadUrl} className="text-action-link" download>
                  <DownloadIcon className="text-action-link__icon" />
                  <span>下载 SOUL.md</span>
                </a>
              </div>
              <pre className="raw-details__pre">{soul.rawSoul}</pre>
            </details>
          </div>

          <aside className="detail-layout__side">
            <article className="install-panel">
              <p className="install-panel__eyebrow">导入这个 Soul</p>
              <InstallCommand slug={soul.slug} codeClassName="install-panel__command" />
              <p className="install-panel__body">
                这条命令会直接用这个 Soul preset 替换本地 <code>SOUL.md</code>。如果你想稳一点，先手动备份，再执行导入。
              </p>
              <ol className="install-panel__steps">
                <li>先备份当前灵魂</li>
                <li>执行 curl 导入命令</li>
                <li>重启 OpenClaw 并试跑一个会话</li>
              </ol>
              <InstallCommand
                slug={soul.slug}
                showCode={false}
                showCopyButton
                copyLabel="复制导入命令"
                copyVariant="dark"
                analyticsEventName="detail_install_copy"
                analyticsSource="soul_detail"
                analyticsPlacement="sidebar_install"
              />
            </article>

            <SoulPackPanel slug={soul.slug} manifest={soulPackManifest} />

            <article className="detail-panel detail-panel--side">
              <h2 className="detail-panel__title detail-panel__title--small">备份当前灵魂</h2>
              <p className="detail-panel__body">替换前先把本地的 <code>SOUL.md</code> 复制一份，回滚会轻松很多。</p>
              <code className="command-block">{backupCommand}</code>
              <CopyButton text={backupCommand} label="复制备份命令" />
            </article>

            <article className="detail-panel detail-panel--side">
              <h2 className="detail-panel__title detail-panel__title--small">原始 SOUL.md</h2>
              <p className="detail-panel__body">可以直接查看这份原始 <code>SOUL.md</code>，核对人格结构，再复制、下载到本地后手动替换。</p>
              <div className="detail-panel__actions">
                <a href={sidebarRawSoulUrl} className="text-action-link">
                  <span>打开原始 SOUL</span>
                  <ArrowRightIcon className="text-action-link__icon" />
                </a>
                <CopyButton
                  text={soul.rawSoul}
                  label="复制原文"
                  analyticsEventName="detail_raw_copy"
                  analyticsSource="soul_detail_raw_panel"
                  analyticsPlacement="sidebar_raw_copy"
                  analyticsSlug={soul.slug}
                />
                <a href={sidebarRawSoulDownloadUrl} className="text-action-link" download>
                  <DownloadIcon className="text-action-link__icon" />
                  <span>下载 SOUL.md</span>
                </a>
              </div>
            </article>

            <article className="detail-panel detail-panel--side">
              <h2 className="detail-panel__title detail-panel__title--small">相似灵魂</h2>
              <ul className="detail-related-list">
                {relatedSouls.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/souls/${item.slug}`} className="detail-related-link">
                      <span className="detail-related-link__meta">{item.categoryLabel} · {item.sourceType}</span>
                      <span className="detail-related-link__row">
                        <span className="detail-related-link__title">{item.title}</span>
                        <ArrowRightIcon className="detail-related-link__icon" />
                      </span>
                      <span className="detail-related-link__summary">{item.summary}</span>
                    </Link>
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
