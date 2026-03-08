import { NextRequest, NextResponse } from 'next/server';

import { getSoulBySlug } from '@/lib/souls';
import { trackEvent, createAnalyticsSessionId, getClientIpAddress, isValidAnalyticsSessionId } from '@/lib/analytics/track';
import {
  ANALYTICS_SESSION_COOKIE_NAME,
  eventRequiresSlug,
  isAnalyticsEventName,
  isAnalyticsSource,
  type AnalyticsMeta,
} from '@/lib/analytics/schema';

export const runtime = 'nodejs';

type RawMeta = Record<string, unknown>;

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeMeta(value: unknown): AnalyticsMeta | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value as RawMeta).filter(([, itemValue]) => {
    return itemValue === null || ['string', 'number', 'boolean'].includes(typeof itemValue);
  });

  if (entries.length === 0) {
    return null;
  }

  return Object.fromEntries(entries) as AnalyticsMeta;
}

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const rawEventName = normalizeOptionalString(payload.eventName);
  if (!rawEventName || !isAnalyticsEventName(rawEventName)) {
    return NextResponse.json({ ok: false, error: 'invalid_event' }, { status: 400 });
  }

  const rawSource = normalizeOptionalString(payload.source);
  if (!rawSource || !isAnalyticsSource(rawSource)) {
    return NextResponse.json({ ok: false, error: 'invalid_source' }, { status: 400 });
  }

  const slug = normalizeOptionalString(payload.slug);
  if (eventRequiresSlug(rawEventName) && !slug) {
    return NextResponse.json({ ok: false, error: 'missing_slug' }, { status: 400 });
  }

  if (slug) {
    const soul = await getSoulBySlug(slug);
    if (!soul) {
      return NextResponse.json({ ok: false, error: 'invalid_slug' }, { status: 404 });
    }
  }

  const cookieSessionId = request.cookies.get(ANALYTICS_SESSION_COOKIE_NAME)?.value;
  const payloadSessionId = normalizeOptionalString(payload.sessionId);
  const sessionId = isValidAnalyticsSessionId(payloadSessionId)
    ? payloadSessionId
    : isValidAnalyticsSessionId(cookieSessionId)
      ? cookieSessionId
      : createAnalyticsSessionId();

  trackEvent({
    eventName: rawEventName,
    slug,
    source: rawSource,
    placement: normalizeOptionalString(payload.placement),
    path: normalizeOptionalString(payload.path),
    sessionId,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    ipAddress: getClientIpAddress(request),
    meta: normalizeMeta(payload.meta),
  });

  const response = NextResponse.json({ ok: true });

  if (cookieSessionId !== sessionId) {
    response.cookies.set({
      name: ANALYTICS_SESSION_COOKIE_NAME,
      value: sessionId,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}
