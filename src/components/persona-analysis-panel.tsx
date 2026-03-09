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

  return (
    <article className="detail-panel detail-panel--persona">
      <div className="persona-panel__header">
        <div>
          <p className="detail-panel__eyebrow">人格画像</p>
          <h2 className="detail-panel__title detail-panel__title--small">先理解这份 Soul 的人格轮廓，再决定要不要导入</h2>
        </div>
        <span className="persona-panel__status">已确认</span>
      </div>

      <p className="persona-panel__summary">{analysis.summary}</p>
      <p className="persona-panel__note">这里不展示总分，只展示人格轮廓，帮助你判断适不适合自己的龙虾。</p>

      <div className="persona-panel__grid">
        <PersonaRadar scores={analysis.publicScores} />

        <div className="persona-panel__dimensions">
          {highlightedDimensions.map((dimension) => (
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
    </article>
  );
}
