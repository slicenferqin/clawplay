import { NextResponse } from 'next/server';

import { isAdminAuthenticated } from '@/lib/submissions/admin';
import { getSubmissionDetailForAdmin } from '@/lib/submissions/service';

export const runtime = 'nodejs';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const detail = getSubmissionDetailForAdmin(id);
  if (!detail) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: detail });
}
