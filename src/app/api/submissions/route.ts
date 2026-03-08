import { NextRequest, NextResponse } from 'next/server';

import { trackEvent, createAnalyticsSessionId, getClientIpAddress, isValidAnalyticsSessionId } from '@/lib/analytics/track';
import { ANALYTICS_SESSION_COOKIE_NAME } from '@/lib/analytics/schema';
import { createSubmission, parseSubmissionInput } from '@/lib/submissions/service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  if (typeof payload.website === 'string' && payload.website.trim()) {
    return NextResponse.json({ ok: false, error: 'invalid_submission' }, { status: 400 });
  }

  try {
    const input = parseSubmissionInput(payload);
    const result = createSubmission(input);
    const cookieSessionId = request.cookies.get(ANALYTICS_SESSION_COOKIE_NAME)?.value;
    const sessionId = isValidAnalyticsSessionId(cookieSessionId) ? cookieSessionId : createAnalyticsSessionId();

    trackEvent({
      eventName: 'submission_submitted',
      source: 'submission',
      placement: 'submit_form',
      path: '/submit',
      sessionId,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      ipAddress: getClientIpAddress(request),
      meta: {
        publicId: result.publicId,
        submissionType: input.submissionType,
        category: input.category,
      },
    });

    const response = NextResponse.json({
      ok: true,
      publicId: result.publicId,
      manageUrl: `/submissions/${result.publicId}?token=${encodeURIComponent(result.manageToken)}`,
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

    return response;
  } catch (error) {
    const code = error instanceof Error ? error.message : 'submission_failed';
    return NextResponse.json({ ok: false, error: code }, { status: 400 });
  }
}
