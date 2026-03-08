import { NextRequest, NextResponse } from 'next/server';

import { isAdminAuthenticated } from '@/lib/submissions/admin';
import { listSubmissions } from '@/lib/submissions/service';
import type { SubmissionStatus } from '@/lib/submissions/schema';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get('status') as SubmissionStatus | null;
  const query = request.nextUrl.searchParams.get('q') || undefined;
  const page = Number.parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(request.nextUrl.searchParams.get('pageSize') || '20', 10);

  return NextResponse.json({ ok: true, data: listSubmissions({ status: status ?? undefined, query, page, pageSize }) });
}
