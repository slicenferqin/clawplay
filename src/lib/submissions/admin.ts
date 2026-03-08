import 'server-only';

import { cookies } from 'next/headers';

import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/submissions/auth';

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value);
}
