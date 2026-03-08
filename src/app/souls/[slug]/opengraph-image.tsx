import { ImageResponse } from 'next/og';

import { renderOgCard, OG_IMAGE_SIZE } from '@/lib/og-image';
import { getSoulBySlug } from '@/lib/souls';

export const alt = 'Soul 分享卡片';
export const size = OG_IMAGE_SIZE;
export const contentType = 'image/png';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const soul = await getSoulBySlug(slug);

  if (!soul) {
    return new ImageResponse(
      renderOgCard({
        eyebrow: 'Soul Not Found',
        title: '这个 Soul 暂时不存在',
        description: '它可能还没收录，或者 slug 已经变化。',
        badges: ['ClawPlay', 'SOUL.md'],
      }),
      size,
    );
  }

  return new ImageResponse(
    renderOgCard({
      eyebrow: `${soul.categoryLabel} / ${soul.sourceType}`,
      title: soul.title,
      description: soul.summary,
      badges: [soul.categoryLabel, ...soul.tags.slice(0, 2)],
      footer: `适合 ${soul.useCases.slice(0, 2).join('、')} · 兼容 ${soul.compatibleModels.slice(0, 1).join('、')}`,
    }),
    size,
  );
}
