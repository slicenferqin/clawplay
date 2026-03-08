import { NextRequest, NextResponse } from 'next/server';
import { notFound } from 'next/navigation';

import { getSoulBySlug } from '@/lib/souls';
import { trackEvent, createAnalyticsSessionId, getClientIpAddress, getPathFromReferer, isValidAnalyticsSessionId } from '@/lib/analytics/track';
import { ANALYTICS_SESSION_COOKIE_NAME, isAnalyticsSource } from '@/lib/analytics/schema';

export const runtime = 'nodejs';

function normalizeOptionalString(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const soul = await getSoulBySlug(slug);

  if (!soul) {
    notFound();
  }

  const isDownload = request.nextUrl.searchParams.get('download') === '1';
  const source = normalizeOptionalString(request.nextUrl.searchParams.get('source'));
  const trackedSource = source && source !== 'unknown' && isAnalyticsSource(source) ? source : null;
  const placement = normalizeOptionalString(request.nextUrl.searchParams.get('placement'));
  const cookieSessionId = request.cookies.get(ANALYTICS_SESSION_COOKIE_NAME)?.value;
  const sessionId = isValidAnalyticsSessionId(cookieSessionId) ? cookieSessionId : createAnalyticsSessionId();

  const response = new NextResponse(soul.rawSoul, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'content-disposition': isDownload ? 'attachment; filename="SOUL.md"' : `inline; filename="${soul.slug}.md"`,
    },
  });

  if (cookieSessionId !== sessionId) {
    response.cookies.set({
      name: ANALYTICS_SESSION_COOKIE_NAME,
      value: sessionId,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      path: '/',
    });
  }

  if (trackedSource) {
    trackEvent({
      eventName: isDownload ? 'detail_raw_download' : 'detail_raw_open',
      slug: soul.slug,
      source: trackedSource,
      placement,
      path: getPathFromReferer(request.headers.get('referer')),
      sessionId,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      ipAddress: getClientIpAddress(request),
    });
  }

  return response;
}
