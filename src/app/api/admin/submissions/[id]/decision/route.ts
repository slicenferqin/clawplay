import { NextRequest, NextResponse } from 'next/server';

import { trackEvent, getClientIpAddress } from '@/lib/analytics/track';
import { isAdminAuthenticated } from '@/lib/submissions/admin';
import { decideSubmission } from '@/lib/submissions/service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const action = payload.action;
  if (!['needs_revision', 'reject', 'approve', 'publish'].includes(String(action))) {
    return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
  }

  try {
    const result = decideSubmission(
      id,
      action as 'needs_revision' | 'reject' | 'approve' | 'publish',
      typeof payload.note === 'string' ? payload.note : null,
      typeof payload.slug === 'string' ? payload.slug : null,
    );

    trackEvent({
      eventName: action === 'publish' ? 'admin_submission_published' : 'admin_submission_reviewed',
      source: 'admin_submission',
      placement: action === 'publish' ? 'decision_publish' : 'decision_review',
      path: `/admin/submissions/${id}`,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      ipAddress: getClientIpAddress(request),
      meta: {
        action: String(action),
      },
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'decision_failed';
    return NextResponse.json({ ok: false, error: code }, { status: 400 });
  }
}
