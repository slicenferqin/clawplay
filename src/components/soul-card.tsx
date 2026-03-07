import Link from 'next/link';

import type { SoulDocument } from '@/lib/souls';

interface SoulCardProps {
  soul: SoulDocument;
}

export function SoulCard({ soul }: SoulCardProps) {
  return (
    <article className="soul-card">
      <div className="soul-card__meta">
        <span>{soul.categoryLabel}</span>
        <span>/</span>
        <span>{soul.sourceType}</span>
      </div>
      <h3 className="soul-card__title">{soul.title}</h3>
      <p className="soul-card__summary">{soul.summary}</p>
      <div className="soul-card__tags">
        {soul.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="tag-pill">
            {tag}
          </span>
        ))}
      </div>
      <Link href={`/souls/${soul.slug}`} className="soul-card__link">
        查看详情
      </Link>
    </article>
  );
}
