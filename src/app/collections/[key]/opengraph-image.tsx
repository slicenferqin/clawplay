import { ImageResponse } from 'next/og';

import { getCollectionByKey } from '@/lib/collections';
import { renderOgCard, OG_IMAGE_SIZE } from '@/lib/og-image';
import { SITE_NAME } from '@/lib/site-config';

export const alt = '专题合集分享卡片';
export const size = OG_IMAGE_SIZE;
export const contentType = 'image/png';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function OpenGraphImage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const collection = await getCollectionByKey(key);

  if (!collection) {
    return new ImageResponse(
      renderOgCard({
        eyebrow: 'Collection Not Found',
        title: '这个专题合集暂时不存在',
        description: '它可能还没开放，或者地址已经变化。',
        badges: [SITE_NAME, '合集'],
      }),
      size,
    );
  }

  return new ImageResponse(
    renderOgCard({
      eyebrow: collection.eyebrow,
      title: collection.title,
      description: collection.summary,
      badges: collection.shareBadges,
      footer: `专题合集 · ${collection.souls.map((soul) => soul.title).slice(0, 2).join('、')}`,
    }),
    size,
  );
}
