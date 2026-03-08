import 'server-only';

import { createHash, createHmac, randomBytes } from 'node:crypto';

export const MANAGE_TOKEN_BYTES = 24;
export const ADMIN_SESSION_COOKIE_NAME = 'clawplay_admin_session';
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function createPublicId() {
  return `sub_${randomBytes(5).toString('hex')}`;
}

export function createManageToken() {
  return randomBytes(MANAGE_TOKEN_BYTES).toString('base64url');
}

export function hashManageToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function getAdminSessionSecret() {
  return process.env.CLAWPLAY_ADMIN_SESSION_SECRET || process.env.CLAWPLAY_ANALYTICS_SALT || 'clawplay-admin-session';
}

export function getAdminPassword() {
  if (process.env.CLAWPLAY_ADMIN_PASSWORD) {
    return process.env.CLAWPLAY_ADMIN_PASSWORD;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'clawplay-admin';
  }

  return null;
}

export function createAdminSessionToken() {
  const payload = {
    exp: Date.now() + ADMIN_SESSION_MAX_AGE * 1000,
    scope: 'admin',
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac('sha256', getAdminSessionSecret()).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | null | undefined) {
  if (!token) {
    return false;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = createHmac('sha256', getAdminSessionSecret()).update(encodedPayload).digest('base64url');
  if (signature !== expectedSignature) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as { exp?: number; scope?: string };
    return payload.scope === 'admin' && typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function getAdminSessionMaxAge() {
  return ADMIN_SESSION_MAX_AGE;
}
