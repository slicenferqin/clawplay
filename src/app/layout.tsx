import type { Metadata } from 'next';

import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'ClawPlay',
  description: 'OpenClaw 中文 SOUL.md 目录站，支持浏览、预览、原始内容查看与 curl 安装。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
