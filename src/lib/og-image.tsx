import type { ReactElement } from 'react';

import { SITE_NAME } from '@/lib/site-config';

export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;

interface OgCardOptions {
  eyebrow: string;
  title: string;
  description: string;
  badges: string[];
  footer?: string;
}

export function renderOgCard({ eyebrow, title, description, badges, footer = '浏览灵魂 · 一键安装 · 投稿收录' }: OgCardOptions): ReactElement {
  return (
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: '#f7f2e8',
        color: '#2f261f',
        fontFamily: 'Inter, Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.62), rgba(247,242,232,1))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '-130px',
          right: '-90px',
          width: '340px',
          height: '340px',
          display: 'flex',
          borderRadius: '999px',
          background: 'rgba(223, 231, 207, 0.95)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-120px',
          left: '-100px',
          width: '300px',
          height: '300px',
          display: 'flex',
          borderRadius: '999px',
          background: 'rgba(240, 235, 224, 0.95)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              borderRadius: '999px',
              border: '1px solid rgba(183, 173, 157, 0.82)',
              background: 'rgba(255, 253, 248, 0.9)',
              color: '#756756',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ display: 'flex', width: '10px', height: '10px', borderRadius: '999px', background: '#708a44' }} />
            <span>{eyebrow}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '940px' }}>
            <div style={{ display: 'flex', fontSize: '64px', fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
            <div style={{ display: 'flex', fontSize: '28px', lineHeight: 1.6, color: '#5f5245', maxWidth: '900px' }}>{description}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {badges.map((badge) => (
              <div
                key={badge}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: '46px',
                  padding: '0 18px',
                  borderRadius: '999px',
                  border: '1px solid rgba(183, 173, 157, 0.72)',
                  background: 'rgba(255, 253, 248, 0.9)',
                  color: '#4d4338',
                  fontSize: '22px',
                  fontWeight: 600,
                }}
              >
                {badge}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', fontSize: '22px', color: '#756756' }}>{footer}</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: '18px',
                background: '#1e201b',
                color: '#f7f2e8',
                fontSize: '24px',
                fontWeight: 800,
                letterSpacing: '0.08em',
              }}
            >
              <span style={{ color: '#a9c76a' }}>+</span>
              <span>{SITE_NAME.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
