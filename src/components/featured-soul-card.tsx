import Link from 'next/link';

import { InstallCommand } from '@/components/install-command';
import { DownloadIcon } from '@/components/icons';
import type { SoulDocument } from '@/lib/souls';

export type FeaturedSoulCardSoul = Pick<SoulDocument, 'slug' | 'title' | 'summary' | 'tags'>;

interface FeaturedSoulCardProps {
  soul: FeaturedSoulCardSoul;
}

interface FeaturedSoulCardContentProps {
  soul: FeaturedSoulCardSoul;
}

function FeaturedSoulCardTags({ soul }: FeaturedSoulCardContentProps) {
  const visibleTags = soul.tags.slice(0, 3);
  const hiddenTagCount = Math.max(soul.tags.length - visibleTags.length, 0);

  return (
    <div className="spotlight-soul-card__tags" aria-label="标签">
      {visibleTags.map((tag, index) => (
        <span
          key={tag}
          className={`spotlight-soul-card__tag${index === 0 ? ' spotlight-soul-card__tag--primary' : ''}`}
        >
          {tag}
        </span>
      ))}
      {hiddenTagCount > 0 ? <span className="spotlight-soul-card__tag spotlight-soul-card__tag--more">+{hiddenTagCount}</span> : null}
    </div>
  );
}

export function FeaturedSoulCardContent({ soul }: FeaturedSoulCardContentProps) {
  return (
    <>
      <div className="spotlight-soul-card__header">
        <div className="spotlight-soul-card__eyebrow">精选灵魂</div>
        <h2 className="spotlight-soul-card__title">{soul.title}</h2>
        <FeaturedSoulCardTags soul={soul} />
      </div>
      <div className="spotlight-soul-card__body">
        <p className="spotlight-soul-card__summary">{soul.summary}</p>
      </div>
      <div className="spotlight-soul-card__footer">
        <div className="spotlight-soul-card__command">
          <InstallCommand slug={soul.slug} codeClassName="spotlight-soul-card__command-code" />
          <DownloadIcon className="spotlight-soul-card__command-icon" />
        </div>
        <div className="spotlight-soul-card__actions">
          <InstallCommand slug={soul.slug} showCode={false} showCopyButton copyLabel="复制安装" copyVariant="dark" />
          <Link href={`/souls/${soul.slug}`} className="spotlight-soul-card__detail-link">
            看预览
          </Link>
        </div>
      </div>
    </>
  );
}

export function FeaturedSoulCard({ soul }: FeaturedSoulCardProps) {
  return (
    <aside className="spotlight-soul-card">
      <FeaturedSoulCardContent soul={soul} />
    </aside>
  );
}
