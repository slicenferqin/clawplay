import { ImageResponse } from 'next/og';

import { renderOgCard, OG_IMAGE_SIZE } from '@/lib/og-image';

export const alt = 'ClawPlay 分享卡片';
export const size = OG_IMAGE_SIZE;
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    renderOgCard({
      eyebrow: 'ClawPlay',
      title: 'OpenClaw 中文 SOUL 灵魂库',
      description: '浏览灵魂、查看预览、复制安装命令、下载原始 SOUL.md，也支持匿名投稿与审核发布。',
      badges: ['灵魂库', '一键安装', '投稿收录'],
    }),
    size,
  );
}
