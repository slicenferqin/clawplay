export const ANALYTICS_SESSION_COOKIE_NAME = 'clawplay_session_id';

export const analyticsEventNames = [
  'home_hero_view',
  'hero_soul_preview_click',
  'hero_install_copy',
  'soul_detail_view',
  'detail_install_copy',
  'detail_raw_open',
  'detail_raw_download',
  'detail_raw_copy',
] as const;

export const analyticsSources = ['home_hero', 'soul_detail', 'soul_detail_raw_panel', 'unknown'] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];
export type AnalyticsSource = (typeof analyticsSources)[number];
export type AnalyticsMetaValue = string | number | boolean | null;
export type AnalyticsMeta = Record<string, AnalyticsMetaValue>;

export interface AnalyticsEventPayload {
  eventName: AnalyticsEventName;
  slug?: string | null;
  source: AnalyticsSource;
  placement?: string | null;
  path?: string | null;
  sessionId?: string | null;
  userAgent?: string | null;
  referer?: string | null;
  ipAddress?: string | null;
  meta?: AnalyticsMeta | null;
}

const analyticsEventNameSet = new Set<string>(analyticsEventNames);
const analyticsSourceSet = new Set<string>(analyticsSources);
const eventsRequiringSlug = new Set<AnalyticsEventName>([
  'hero_soul_preview_click',
  'hero_install_copy',
  'soul_detail_view',
  'detail_install_copy',
  'detail_raw_open',
  'detail_raw_download',
  'detail_raw_copy',
]);

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return analyticsEventNameSet.has(value);
}

export function isAnalyticsSource(value: string): value is AnalyticsSource {
  return analyticsSourceSet.has(value);
}

export function eventRequiresSlug(eventName: AnalyticsEventName): boolean {
  return eventsRequiringSlug.has(eventName);
}
