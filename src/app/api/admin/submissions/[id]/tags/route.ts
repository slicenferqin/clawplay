import { NextRequest, NextResponse } from 'next/server';

import { isAdminAuthenticated } from '@/lib/submissions/admin';
import { applySubmissionTagAction } from '@/lib/submissions/service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const action = String(payload.action ?? '');
  if (!['merge', 'accept', 'dismiss'].includes(action)) {
    return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
  }

  const { id } = await context.params;

  try {
    const updatedSubmission = applySubmissionTagAction(
      id,
      action as 'merge' | 'accept' | 'dismiss',
      typeof payload.proposedTag === 'string' ? payload.proposedTag : '',
      typeof payload.targetTag === 'string' ? payload.targetTag : null,
    );

    return NextResponse.json({ ok: true, data: updatedSubmission });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'tag_action_failed';
    return NextResponse.json({ ok: false, error: code }, { status: 400 });
  }
}
