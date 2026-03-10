import type { SoulDocument } from '@/lib/souls-types';
import type { PersonaProfileViewModel } from '@/lib/persona/profile';

interface PersonaProfileProps {
  soul: SoulDocument;
  profile: PersonaProfileViewModel;
}

const sectionLabels = {
  coreTruths: 'Core Truths',
  boundaries: 'Boundaries',
  vibe: 'Vibe',
  continuity: 'Continuity',
} as const;

export function PersonaProfile({ soul, profile }: PersonaProfileProps) {
  return (
    <article className="detail-panel detail-panel--persona-profile">
      <div className="persona-profile__hero">
        <div>
          <p className="detail-panel__eyebrow">人格定位</p>
          <h2 className="detail-panel__title">{profile.tagline}</h2>
          <p className="detail-panel__body persona-profile__lead">
            这份 Soul 更适合被理解成一个「{profile.archetype}」人格起点，而不是一段抽离上下文的提示词文本。
          </p>
        </div>
        <div className="persona-profile__meta">
          <span className="persona-profile__pill persona-profile__pill--accent">{profile.archetype}</span>
          {profile.recommendedModel ? <span className="persona-profile__pill">推荐模型：{profile.recommendedModel}</span> : null}
        </div>
      </div>

      <p className="persona-profile__hook">{soul.previewHook}</p>

      <div className="persona-profile__chips">
        {profile.traitChips.map((chip) => <span key={chip} className="persona-profile__chip">{chip}</span>)}
      </div>

      <details className="detail-disclosure detail-disclosure--soft">
        <summary className="detail-disclosure__summary">
          <span className="detail-disclosure__summary-block">
            <span className="detail-disclosure__summary-title">展开看人格结构</span>
            <span className="detail-disclosure__summary-note">Core Truths / Boundaries / Vibe / Continuity</span>
          </span>
        </summary>

        <div className="detail-disclosure__content">
          <div className="persona-structure-grid">
            <section className="persona-structure-card">
              <span className="persona-structure-card__eyebrow">{sectionLabels.coreTruths}</span>
              <ul className="detail-panel__list">
                {profile.coreTruths.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section className="persona-structure-card">
              <span className="persona-structure-card__eyebrow">{sectionLabels.boundaries}</span>
              <ul className="detail-panel__list">
                {profile.boundaries.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section className="persona-structure-card">
              <span className="persona-structure-card__eyebrow">{sectionLabels.vibe}</span>
              <ul className="detail-panel__list">
                {profile.vibe.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section className="persona-structure-card">
              <span className="persona-structure-card__eyebrow">{sectionLabels.continuity}</span>
              <ul className="detail-panel__list">
                {profile.continuity.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          </div>

          <div className="persona-profile__footer">
            <p className="detail-panel__body">
              原始 <code>SOUL.md</code> 仍然是最终依据；这层结构化摘要的作用，是让你先判断这个人格是不是你想导入的方向。
            </p>
            <p className="detail-panel__body persona-profile__intro">补充说明：{soul.intro}</p>
          </div>
        </div>
      </details>
    </article>
  );
}
