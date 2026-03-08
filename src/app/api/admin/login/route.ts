import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_SESSION_COOKIE_NAME, createAdminSessionToken, getAdminPassword, getAdminSessionMaxAge } from '@/lib/submissions/auth';

export const runtime = 'nodejs';

function shouldUseSecureCookie(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0]?.trim() === 'https';
  }

  return request.nextUrl.protocol === 'https:';
}

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const adminPassword = getAdminPassword();
  if (!adminPassword) {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 500 });
  }

  if (payload.password !== adminPassword) {
    return NextResponse.json({ ok: false, error: 'invalid_password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: createAdminSessionToken(),
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(request),
    path: '/',
    maxAge: getAdminSessionMaxAge(),
  });

  return response;
}
