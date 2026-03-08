import { NextRequest, NextResponse } from 'next/server';

import { getHotlist } from '@/lib/analytics/hotlist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parsePositiveInteger(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);
  return Number.isNaN(parsedValue) ? undefined : parsedValue;
}

export async function GET(request: NextRequest) {
  const days = parsePositiveInteger(request.nextUrl.searchParams.get('days'));
  const limit = parsePositiveInteger(request.nextUrl.searchParams.get('limit'));
  const hotlist = await getHotlist({ days, limit });

  return NextResponse.json(hotlist);
}
