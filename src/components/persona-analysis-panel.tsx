import { getPersonaDimensionDescriptor, PUBLIC_PERSONA_DIMENSIONS } from '@/lib/persona/constants';
import type { PersonaAnalysisRecord } from '@/lib/persona/schema';

import { PersonaRadar } from '@/components/persona-radar';

interface PersonaAnalysisPanelProps {
  analysis: PersonaAnalysisRecord;
}

export function PersonaAnalysisPanel({ analysis }: PersonaAnalysisPanelProps) {
  const highlightedDimensions = [...PUBLIC_PERSONA_DIMENSIONS]
    .map((dimension) => ({
      ...dimension,
      score: analysis.publicScores[dimension.key],
      reason: analysis.publicReasons[dimension.key],
    }))
    .sort((left, right) => right.score - left.score);

  const primaryDimensions = highlightedDimensions.slice(0, 3);
  const secondaryDimensions = highlightedDimensions.slice(3);

  return (
    <article className="detail-panel detail-panel--persona">
      <div className="persona-panel__header">
        <div>
          <p className="detail-panel__eyebrow">人格画像</p>
          <h2 className="detail-panel__title detail-panel__title--small">先看轮廓，再按需展开理由</h2>
        </div>
        <span className="persona-panel__status">已确认</span>
      </div>

      <p className="persona-panel__summary">{analysis.summary}</p>
      <p className="persona-panel__note">这里只展示人格轮廓，不做总分排名。</p>

      <div className="persona-panel__grid">
        <PersonaRadar scores={analysis.publicScores} />

        <div className="persona-panel__dimensions persona-panel__dimensions--compact">
          {primaryDimensions.map((dimension) => (
            <section key={dimension.key} className="persona-panel__dimension">
              <div className="persona-panel__dimension-top">
                <strong>{dimension.label}</strong>
                <span className="persona-panel__dimension-chip">{getPersonaDimensionDescriptor(dimension.key, dimension.score)} · {dimension.score}</span>
              </div>
              <p>{dimension.reason}</p>
            </section>
          ))}
        </div>
      </div>

      {secondaryDimensions.length > 0 ? (
        <details className="detail-disclosure detail-disclosure--soft persona-panel__more">
          <summary className="detail-disclosure__summary">
            <span className="detail-disclosure__summary-block">
              <span className="detail-disclosure__summary-title">展开看其余维度理由</span>
              <span className="detail-disclosure__summary-note">其余 {secondaryDimensions.length} 个维度</span>
            </span>
          </summary>
          <div className="detail-disclosure__content">
            <div className="persona-panel__dimensions persona-panel__dimensions--secondary">
              {secondaryDimensions.map((dimension) => (
                <section key={dimension.key} className="persona-panel__dimension">
                  <div className="persona-panel__dimension-top">
                    <strong>{dimension.label}</strong>
                    <span className="persona-panel__dimension-chip">{getPersonaDimensionDescriptor(dimension.key, dimension.score)} · {dimension.score}</span>
                  </div>
                  <p>{dimension.reason}</p>
                </section>
              ))}
            </div>
          </div>
        </details>
      ) : null}
    </article>
  );
}
