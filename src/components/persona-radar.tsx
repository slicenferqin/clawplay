import { PUBLIC_PERSONA_DIMENSIONS } from '@/lib/persona/constants';
import type { PersonaPublicScores } from '@/lib/persona/schema';

interface PersonaRadarProps {
  scores: PersonaPublicScores;
  size?: number;
}

function polarToCartesian(angle: number, radius: number, center: number) {
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

export function PersonaRadar({ scores, size = 300 }: PersonaRadarProps) {
  const center = size / 2;
  const radius = size * 0.32;
  const levels = [0.25, 0.5, 0.75, 1];
  const angleStep = (Math.PI * 2) / PUBLIC_PERSONA_DIMENSIONS.length;
  const startAngle = -Math.PI / 2;

  const polygonPoints = PUBLIC_PERSONA_DIMENSIONS.map((dimension, index) => {
    const angle = startAngle + angleStep * index;
    const point = polarToCartesian(angle, radius * (scores[dimension.key] / 100), center);
    return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
  }).join(' ');

  return (
    <div className="persona-radar" aria-label="人格维度雷达图">
      <svg viewBox={`0 0 ${size} ${size}`} className="persona-radar__svg" role="img" aria-hidden="true">
        {levels.map((level) => {
          const points = PUBLIC_PERSONA_DIMENSIONS.map((_, index) => {
            const angle = startAngle + angleStep * index;
            const point = polarToCartesian(angle, radius * level, center);
            return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
          }).join(' ');

          return (
            <polygon
              key={level}
              points={points}
              className="persona-radar__ring"
            />
          );
        })}

        {PUBLIC_PERSONA_DIMENSIONS.map((dimension, index) => {
          const angle = startAngle + angleStep * index;
          const edge = polarToCartesian(angle, radius, center);
          const label = polarToCartesian(angle, radius + 28, center);

          return (
            <g key={dimension.key}>
              <line x1={center} y1={center} x2={edge.x} y2={edge.y} className="persona-radar__axis" />
              <text x={label.x} y={label.y} className="persona-radar__label" textAnchor="middle" dominantBaseline="middle">
                {dimension.label}
              </text>
            </g>
          );
        })}

        <polygon points={polygonPoints} className="persona-radar__shape" />

        {PUBLIC_PERSONA_DIMENSIONS.map((dimension, index) => {
          const angle = startAngle + angleStep * index;
          const point = polarToCartesian(angle, radius * (scores[dimension.key] / 100), center);
          return <circle key={dimension.key} cx={point.x} cy={point.y} r="4.5" className="persona-radar__dot" />;
        })}
      </svg>
    </div>
  );
}
