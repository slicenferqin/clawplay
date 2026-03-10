import { ArrowRightIcon, DownloadIcon } from '@/components/icons';
import type { SoulPackManifest } from '@/lib/soul-pack/schema';

interface SoulPackPanelProps {
  slug: string;
  manifest: SoulPackManifest;
}

export function SoulPackPanel({ slug, manifest }: SoulPackPanelProps) {
  return (
    <article className="detail-panel detail-panel--side soul-pack-panel">
      <details className="detail-disclosure detail-disclosure--soft">
        <summary className="detail-disclosure__summary">
          <span className="detail-disclosure__summary-block">
            <span className="detail-panel__eyebrow">Soul Pack</span>
            <span className="detail-disclosure__summary-title">结构化人格资产</span>
            <span className="detail-disclosure__summary-note">次级信息，真正导入前再展开看就够了</span>
          </span>
          <span className="tag-pill">Manifest v1</span>
        </summary>

        <div className="detail-disclosure__content soul-pack-panel__content">
          <p className="detail-panel__body">
            这不是完整环境包，而是一份围绕当前 Soul 的结构化 manifest：把人格定位、推荐模型、导入说明和示例对话整理成机器可读的资产描述文件。
          </p>

          <div className="soul-pack-panel__section">
            <h3 className="detail-panel__subheading">推荐模型</h3>
            <div className="detail-chip-list">
              {manifest.runtime.recommendedModels.map((model) => <span key={model} className="tag-pill">{model}</span>)}
            </div>
          </div>

          <div className="soul-pack-panel__section">
            <h3 className="detail-panel__subheading">推荐技能 / 工具</h3>
            <div className="detail-chip-list">
              {manifest.runtime.recommendedSkillsOrTools.length > 0
                ? manifest.runtime.recommendedSkillsOrTools.map((item) => <span key={item} className="tag-pill">{item}</span>)
                : <span className="tag-pill">当前没有额外建议</span>}
            </div>
          </div>

          <div className="soul-pack-panel__section">
            <h3 className="detail-panel__subheading">导入备注</h3>
            <ul className="detail-panel__list detail-panel__list--compact">
              {manifest.install.installNotes.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>

          <div className="detail-panel__actions soul-pack-panel__actions">
            <a href={`/api/packs/${slug}`} className="text-action-link" target="_blank" rel="noreferrer">
              <span>查看 JSON</span>
              <ArrowRightIcon className="text-action-link__icon" />
            </a>
            <a href={`/api/packs/${slug}?download=1`} className="text-action-link">
              <DownloadIcon className="text-action-link__icon" />
              <span>下载 Pack</span>
            </a>
          </div>
        </div>
      </details>
    </article>
  );
}
