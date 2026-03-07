import Link from 'next/link';

import { InstallCommand } from '@/components/install-command';
import { DownloadIcon } from '@/components/icons';
import type { SoulDocument } from '@/lib/souls';

interface FeaturedSoulCardProps {
  soul: SoulDocument;
}

export function FeaturedSoulCard({ soul }: FeaturedSoulCardProps) {
  return (
    <aside className="spotlight-soul-card">
      <div className="spotlight-soul-card__eyebrow">精选灵魂</div>
      <h2 className="spotlight-soul-card__title">{soul.title}</h2>
      <p className="spotlight-soul-card__summary">{soul.summary}</p>
      <div className="spotlight-soul-card__meta">标签：{soul.tags.join(' / ')}</div>
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
    </aside>
  );
}
