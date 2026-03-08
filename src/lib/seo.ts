import 'server-only';

import type { Metadata } from 'next';

import { DEFAULT_OG_IMAGE_PATH, DEFAULT_SITE_URL, PUBLIC_SITE_URL, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from '@/lib/site-config';
import type { SoulDocument } from '@/lib/souls-types';

function normalizeSiteUrl(value: string) {
  return value.replace(/\/$/, '');
}

export function getSiteUrl() {
  return normalizeSiteUrl(process.env.CLAWPLAY_SITE_URL ?? PUBLIC_SITE_URL ?? DEFAULT_SITE_URL);
}

export function getSiteMetadataBase() {
  return new URL(getSiteUrl());
}

export function buildAbsoluteUrl(pathname = '/') {
  return new URL(pathname, `${getSiteUrl()}/`).toString();
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function trimText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1).trimEnd()}…` : value;
}

function buildTitle(title?: string) {
  return title ? `${title} · ${SITE_NAME}` : SITE_TITLE;
}

function buildPageKeywords(values: string[] = []) {
  return dedupe([SITE_NAME, 'OpenClaw', 'SOUL.md', '灵魂库', 'AI 灵魂', 'OpenClaw Soul', ...values]);
}

export function getBaseMetadata(): Metadata {
  return {
    metadataBase: getSiteMetadataBase(),
    applicationName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      siteName: SITE_NAME,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
  };
}

interface BuildPageMetadataOptions {
  title?: string;
  description?: string;
  pathname: string;
  keywords?: string[];
  ogImagePath?: string;
}

export function buildPageMetadata(options: BuildPageMetadataOptions): Metadata {
  const title = buildTitle(options.title);
  const description = trimText(options.description ?? SITE_DESCRIPTION, 160);
  const imagePath = options.ogImagePath ?? DEFAULT_OG_IMAGE_PATH;
  const keywords = buildPageKeywords(options.keywords);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: options.pathname,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      siteName: SITE_NAME,
      title,
      description,
      url: options.pathname,
      images: [imagePath],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imagePath],
    },
  };
}

interface BuildNoIndexMetadataOptions {
  title: string;
  description?: string;
}

export function buildNoIndexMetadata(options: BuildNoIndexMetadataOptions): Metadata {
  const title = buildTitle(options.title);
  const description = trimText(options.description ?? SITE_DESCRIPTION, 160);

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      siteName: SITE_NAME,
      title,
      description,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
  };
}

export function buildSoulDescription(soul: SoulDocument) {
  const highlights = dedupe([...soul.useCases.slice(0, 2), ...soul.compatibleModels.slice(0, 1)]);

  if (highlights.length === 0) {
    return trimText(soul.summary, 160);
  }

  return trimText(`${soul.summary} 适合 ${highlights.join('、')}。`, 160);
}

export function buildSoulMetadata(soul: SoulDocument): Metadata {
  return buildPageMetadata({
    title: `${soul.title} · ${soul.categoryLabel}`,
    description: buildSoulDescription(soul),
    pathname: `/souls/${soul.slug}`,
    ogImagePath: `/souls/${soul.slug}/opengraph-image`,
    keywords: [soul.categoryLabel, soul.sourceType, ...soul.tags, ...soul.useCases, ...soul.compatibleModels],
  });
}
