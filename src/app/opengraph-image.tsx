import { ImageResponse } from 'next/og';

import { renderOgCard, OG_IMAGE_SIZE } from '@/lib/og-image';

export const alt = 'ClawPlay 分享卡片';
export const size = OG_IMAGE_SIZE;
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    renderOgCard({
      eyebrow: 'ClawPlay',
      title: 'OpenClaw Soul 人格分享平台',
      description: '发现灵魂、理解人格气质、复制导入命令、下载原始 SOUL.md，也支持匿名投稿与审核发布。',
      badges: ['Soul 人格', '导入说明', '投稿收录'],
    }),
    size,
  );
}
