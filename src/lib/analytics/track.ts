import 'server-only';

import { createHash, randomUUID } from 'node:crypto';

import type { AnalyticsEventPayload } from '@/lib/analytics/schema';
import { getAnalyticsDatabase } from '@/lib/analytics/db';

const insertAnalyticsEventStatement = `
  INSERT INTO analytics_events (
    id,
    event_name,
    slug,
    source,
    placement,
    path,
    session_id,
    user_agent,
    referer,
    ip_hash,
    meta_json,
    created_at
  ) VALUES (
    @id,
    @event_name,
    @slug,
    @source,
    @placement,
    @path,
    @session_id,
    @user_agent,
    @referer,
    @ip_hash,
    @meta_json,
    @created_at
  )
`;

export function createAnalyticsSessionId() {
  return randomUUID();
}

export function isValidAnalyticsSessionId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 16 && value.trim().length <= 128;
}

export function getClientIpAddress(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    const firstForwardedIp = forwardedFor.split(',')[0]?.trim();
    if (firstForwardedIp) {
      return firstForwardedIp;
    }
  }

  return request.headers.get('x-real-ip');
}

export function getPathFromReferer(referer: string | null) {
  if (!referer) {
    return null;
  }

  try {
    return new URL(referer).pathname;
  } catch {
    return null;
  }
}

function hashIpAddress(ipAddress: string | null | undefined) {
  if (!ipAddress) {
    return null;
  }

  const salt = process.env.CLAWPLAY_ANALYTICS_SALT ?? 'clawplay-analytics';
  return createHash('sha256').update(`${salt}:${ipAddress}`).digest('hex');
}

export function trackEvent(event: AnalyticsEventPayload) {
  const database = getAnalyticsDatabase();
  const statement = database.prepare(insertAnalyticsEventStatement);
  const createdAt = new Date().toISOString();
  const normalizedMeta = event.meta && Object.keys(event.meta).length > 0 ? JSON.stringify(event.meta) : null;

  statement.run({
    id: randomUUID(),
    event_name: event.eventName,
    slug: event.slug ?? null,
    source: event.source,
    placement: event.placement ?? null,
    path: event.path ?? null,
    session_id: event.sessionId ?? null,
    user_agent: event.userAgent ?? null,
    referer: event.referer ?? null,
    ip_hash: hashIpAddress(event.ipAddress),
    meta_json: normalizedMeta,
    created_at: createdAt,
  });
}
