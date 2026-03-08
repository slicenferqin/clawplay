import { NextRequest, NextResponse } from 'next/server';

import { getSubmissionByPublicIdForApi, parseSubmissionInput, updateSubmissionByManageToken } from '@/lib/submissions/service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });
  }

  const result = getSubmissionByPublicIdForApi(publicId, token);
  if (!result) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: result });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const token = typeof payload.token === 'string' ? payload.token : '';
  if (!token) {
    return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });
  }

  try {
    const input = parseSubmissionInput(payload);
    const submission = updateSubmissionByManageToken(publicId, token, input);
    return NextResponse.json({ ok: true, submission });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'revision_failed';
    return NextResponse.json({ ok: false, error: code }, { status: 400 });
  }
}
