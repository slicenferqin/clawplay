'use client';

import type { AnalyticsEventName, AnalyticsMeta, AnalyticsSource } from '@/lib/analytics/schema';
import { ANALYTICS_SESSION_COOKIE_NAME } from '@/lib/analytics/schema';

const SESSION_STORAGE_PREFIX = 'clawplay.analytics.once.';
const SESSION_STORAGE_KEY = 'clawplay.analytics.session_id';
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function readFromLocalStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeToLocalStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function readFromSessionStorage(key: string) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeToSessionStorage(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    return;
  }
}

interface TrackClientEventInput {
  eventName: AnalyticsEventName;
  slug?: string;
  source: AnalyticsSource;
  placement?: string;
  path?: string;
  meta?: AnalyticsMeta;
}

function getCookieValue(name: string) {
  const prefix = `${name}=`;

  return document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length);
}

function persistSessionId(sessionId: string) {
  writeToLocalStorage(SESSION_STORAGE_KEY, sessionId);
  document.cookie = `${ANALYTICS_SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; Max-Age=${SESSION_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

function formatUuid(bytes: Uint8Array) {
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0'));

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

function createClientSessionId() {
  const cryptoObject = globalThis.crypto;

  if (typeof cryptoObject?.randomUUID === 'function') {
    return cryptoObject.randomUUID();
  }

  if (typeof cryptoObject?.getRandomValues === 'function') {
    const bytes = cryptoObject.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return formatUuid(bytes);
  }

  return `cp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreateAnalyticsSessionId() {
  const localSessionId = readFromLocalStorage(SESSION_STORAGE_KEY);
  if (localSessionId) {
    persistSessionId(localSessionId);
    return localSessionId;
  }

  const cookieSessionId = getCookieValue(ANALYTICS_SESSION_COOKIE_NAME);
  if (cookieSessionId) {
    persistSessionId(cookieSessionId);
    return cookieSessionId;
  }

  const sessionId = createClientSessionId();
  persistSessionId(sessionId);

  return sessionId;
}

function buildEventPayload(input: TrackClientEventInput) {
  return JSON.stringify({
    ...input,
    path: input.path ?? window.location.pathname,
    sessionId: getOrCreateAnalyticsSessionId(),
  });
}

export function trackClientEvent(input: TrackClientEventInput) {
  if (typeof window === 'undefined') {
    return;
  }

  const body = buildEventPayload(input);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    const queued = navigator.sendBeacon('/api/events', blob);

    if (queued) {
      return;
    }
  }

  void fetch('/api/events', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body,
    credentials: 'same-origin',
    keepalive: true,
  }).catch(() => undefined);
}

export function trackClientEventOnce(storageKey: string, input: TrackClientEventInput) {
  if (typeof window === 'undefined') {
    return false;
  }

  const dedupeKey = `${SESSION_STORAGE_PREFIX}${storageKey}`;
  if (readFromSessionStorage(dedupeKey) === '1') {
    return false;
  }

  writeToSessionStorage(dedupeKey, '1');
  trackClientEvent(input);

  return true;
}
