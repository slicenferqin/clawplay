import type { PersonaProfileViewModel } from '@/lib/persona/profile';

interface PersonaFitPanelProps {
  profile: PersonaProfileViewModel;
}

export function PersonaFitPanel({ profile }: PersonaFitPanelProps) {
  return (
    <article className="detail-panel persona-fit-panel">
      <div className="persona-fit-panel__header">
        <div>
          <p className="detail-panel__eyebrow">适配判断</p>
          <h2 className="detail-panel__title detail-panel__title--small">先判断它适不适合你，再决定要不要导入</h2>
        </div>
      </div>

      <div className="persona-fit-panel__grid">
        <section className="persona-fit-panel__column persona-fit-panel__column--fit">
          <h3 className="detail-panel__subheading">适合谁</h3>
          <ul className="detail-panel__list persona-fit-panel__list">
            {profile.fitFor.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <section className="persona-fit-panel__column persona-fit-panel__column--not-fit">
          <h3 className="detail-panel__subheading">不太适合谁</h3>
          <ul className="detail-panel__list persona-fit-panel__list">
            {profile.notFitFor.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      </div>
    </article>
  );
}
