import 'server-only';

import { getAnalyticsDatabase } from '@/lib/analytics/db';
import { getAllSouls } from '@/lib/souls';

interface HotlistOptions {
  days?: number;
  limit?: number;
}

interface EventCountRow {
  slug: string;
  event_name: string;
  event_count: number;
}

interface HotlistCounts {
  detailView: number;
  heroPreviewClick: number;
  installCopy: number;
  rawDownload: number;
  rawCopy: number;
  rawOpen: number;
}

interface HotlistItem {
  slug: string;
  title: string;
  hotScore: number;
  isQualified: boolean;
  counts: HotlistCounts;
}

interface HotlistResult {
  windowDays: number;
  generatedAt: string;
  items: HotlistItem[];
}

function createEmptyCounts(): HotlistCounts {
  return {
    detailView: 0,
    heroPreviewClick: 0,
    installCopy: 0,
    rawDownload: 0,
    rawCopy: 0,
    rawOpen: 0,
  };
}

function normalizeWindowDays(days?: number) {
  if (!days || Number.isNaN(days)) {
    return 30;
  }

  return Math.min(Math.max(Math.floor(days), 1), 90);
}

function normalizeLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return 10;
  }

  return Math.min(Math.max(Math.floor(limit), 1), 50);
}

function getHotScore(counts: HotlistCounts) {
  return counts.detailView * 1
    + counts.heroPreviewClick * 2
    + counts.installCopy * 3
    + counts.rawDownload * 2
    + counts.rawCopy * 1;
}

function getTotalCount(counts: HotlistCounts) {
  return counts.detailView
    + counts.heroPreviewClick
    + counts.installCopy
    + counts.rawDownload
    + counts.rawCopy
    + counts.rawOpen;
}

export async function getHotlist(options: HotlistOptions = {}): Promise<HotlistResult> {
  const windowDays = normalizeWindowDays(options.days);
  const limit = normalizeLimit(options.limit);
  const cutoffDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const database = getAnalyticsDatabase();
  const souls = await getAllSouls();
  const soulTitleMap = new Map(souls.map((soul) => [soul.slug, soul.title]));
  const rows = database.prepare(`
    SELECT slug, event_name, COUNT(*) AS event_count
    FROM analytics_events
    WHERE slug IS NOT NULL
      AND created_at >= ?
    GROUP BY slug, event_name
  `).all(cutoffDate) as EventCountRow[];

  const countsBySlug = new Map<string, HotlistCounts>();

  for (const row of rows) {
    if (!row.slug || !soulTitleMap.has(row.slug)) {
      continue;
    }

    const counts = countsBySlug.get(row.slug) ?? createEmptyCounts();

    switch (row.event_name) {
      case 'soul_detail_view':
        counts.detailView = row.event_count;
        break;
      case 'hero_soul_preview_click':
        counts.heroPreviewClick = row.event_count;
        break;
      case 'hero_install_copy':
      case 'detail_install_copy':
        counts.installCopy += row.event_count;
        break;
      case 'detail_raw_download':
        counts.rawDownload = row.event_count;
        break;
      case 'detail_raw_copy':
        counts.rawCopy = row.event_count;
        break;
      case 'detail_raw_open':
        counts.rawOpen = row.event_count;
        break;
      default:
        break;
    }

    countsBySlug.set(row.slug, counts);
  }

  const items = Array.from(countsBySlug.entries())
    .map(([slug, counts]) => ({
      slug,
      title: soulTitleMap.get(slug) ?? slug,
      hotScore: getHotScore(counts),
      isQualified: getTotalCount(counts) >= 3,
      counts,
    }))
    .sort((left, right) => {
      if (right.hotScore !== left.hotScore) {
        return right.hotScore - left.hotScore;
      }

      if (right.counts.installCopy !== left.counts.installCopy) {
        return right.counts.installCopy - left.counts.installCopy;
      }

      if (right.counts.detailView !== left.counts.detailView) {
        return right.counts.detailView - left.counts.detailView;
      }

      return left.slug.localeCompare(right.slug, 'zh-CN');
    })
    .slice(0, limit);

  return {
    windowDays,
    generatedAt: new Date().toISOString(),
    items,
  };
}
