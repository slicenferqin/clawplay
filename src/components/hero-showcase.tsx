'use client';

import { useEffect, useMemo, useState } from 'react';

import { FeaturedSoulCardContent } from '@/components/featured-soul-card';
import { SiteSearchForm } from '@/components/site-search-form';
import { trackClientEventOnce } from '@/lib/analytics/client';

export interface HeroShowcaseSoul {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  displayName: string;
}

interface HeroShowcaseProps {
  soulCount: number;
  souls: HeroShowcaseSoul[];
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  return prefersReducedMotion;
}

export function HeroShowcase({ soulCount, souls }: HeroShowcaseProps) {
  const items = useMemo(() => souls.filter(Boolean), [souls]);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayText, setDisplayText] = useState(items[0]?.displayName ?? '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [spotlightSoul, setSpotlightSoul] = useState<HeroShowcaseSoul | null>(items[0] ?? null);
  const [incomingSoul, setIncomingSoul] = useState<HeroShowcaseSoul | null>(null);

  useEffect(() => {
    trackClientEventOnce('home_hero_view', {
      eventName: 'home_hero_view',
      source: 'home_hero',
      placement: 'hero_module',
    });
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    setDisplayText(items[0]?.displayName ?? '');
    setIsDeleting(false);
    setSpotlightSoul(items[0] ?? null);
    setIncomingSoul(null);
  }, [items]);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    if (prefersReducedMotion || items.length === 1) {
      setDisplayText(items[0]?.displayName ?? '');
      setActiveIndex(0);
      setIsDeleting(false);
      setSpotlightSoul(items[0] ?? null);
      setIncomingSoul(null);
      return;
    }

    const currentItem = items[activeIndex]?.displayName ?? '';
    let timeoutId: number;

    if (!isDeleting && displayText !== currentItem) {
      timeoutId = window.setTimeout(() => {
        setDisplayText(currentItem.slice(0, displayText.length + 1));
      }, 84);
    } else if (!isDeleting && displayText === currentItem) {
      timeoutId = window.setTimeout(() => {
        setIsDeleting(true);
      }, 1800);
    } else if (isDeleting && displayText.length > 0) {
      timeoutId = window.setTimeout(() => {
        setDisplayText(currentItem.slice(0, displayText.length - 1));
      }, 48);
    } else {
      timeoutId = window.setTimeout(() => {
        setActiveIndex((index) => (index + 1) % items.length);
        setIsDeleting(false);
      }, 220);
    }

    return () => window.clearTimeout(timeoutId);
  }, [activeIndex, displayText, isDeleting, items, prefersReducedMotion]);

  const activeSoul = items[activeIndex] ?? items[0] ?? null;

  useEffect(() => {
    if (!activeSoul) {
      setSpotlightSoul(null);
      setIncomingSoul(null);
      return;
    }

    if (prefersReducedMotion) {
      setSpotlightSoul(activeSoul);
      setIncomingSoul(null);
      return;
    }

    if (!spotlightSoul || spotlightSoul.slug === activeSoul.slug) {
      if (!spotlightSoul) {
        setSpotlightSoul(activeSoul);
      }
      setIncomingSoul(null);
      return;
    }

    setIncomingSoul(activeSoul);

    const timeoutId = window.setTimeout(() => {
      setSpotlightSoul(activeSoul);
      setIncomingSoul(null);
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [activeSoul, prefersReducedMotion, spotlightSoul]);

  if (!activeSoul || !spotlightSoul) {
    return null;
  }

  return (
    <section className="hero-grid">
      <div className="hero-grid__content">
        <p className="eyebrow">为 OpenClaw 精选的中文 Soul</p>
        <h1 className="hero-grid__title">
          <span className="hero-grid__title-prefix">先看感觉，再决定装</span>
          <span className="hero-grid__title-dynamic">
            <span className={`rotating-soul-name${prefersReducedMotion || items.length <= 1 ? ' rotating-soul-name--static' : ''}`}>
              <span className="rotating-soul-name__visual" aria-hidden="true">
                <span className="rotating-soul-name__text">{displayText || '\u00A0'}</span>
                {prefersReducedMotion || items.length <= 1 ? null : <span className="rotating-soul-name__cursor" />}
              </span>
              <span className="sr-only">{activeSoul.displayName}</span>
            </span>
            <span className="hero-grid__title-punctuation" aria-hidden="true">。</span>
          </span>
        </h1>
        <p className="hero-grid__description">
          ClawPlay 把零散的 <code>SOUL.md</code> 整理成可浏览、可比较、可安装的中文目录站。
        </p>
        <SiteSearchForm placeholder="搜索灵魂、角色、使用场景" />
        <div className="hero-stats">
          <span>{soulCount} 个已收录灵魂</span>
          <span>3 条核心路径</span>
          <span>curl 安装</span>
        </div>
      </div>
      <div className="hero-grid__spotlight">
        <aside className="spotlight-soul-card">
          <div className="spotlight-soul-card__viewport">
            <div className={`spotlight-soul-card__pane${incomingSoul ? ' spotlight-soul-card__pane--leaving' : ''}`}>
              <FeaturedSoulCardContent soul={spotlightSoul} />
            </div>
            {incomingSoul ? (
              <div className="spotlight-soul-card__pane spotlight-soul-card__pane--incoming">
                <FeaturedSoulCardContent soul={incomingSoul} />
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
