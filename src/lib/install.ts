import { PUBLIC_SITE_URL } from '@/lib/site-config';

export const INSTALL_TARGET_PATH = '~/.openclaw/workspace/SOUL.md';
export const BACKUP_TARGET_PATH = '~/.openclaw/workspace/SOUL.backup.md';
export const SITE_URL_PLACEHOLDER = PUBLIC_SITE_URL;

interface RawSoulPathOptions {
  baseUrl?: string;
  download?: boolean;
  source?: string;
  placement?: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

export function getRawSoulPath(slug: string, options: RawSoulPathOptions = {}): string {
  const searchParams = new URLSearchParams();

  if (options.download) {
    searchParams.set('download', '1');
  }

  if (options.source) {
    searchParams.set('source', options.source);
  }

  if (options.placement) {
    searchParams.set('placement', options.placement);
  }

  const path = `/api/raw/${slug}`;
  const queryString = searchParams.toString();
  const resolvedPath = queryString ? `${path}?${queryString}` : path;

  return options.baseUrl ? `${normalizeBaseUrl(options.baseUrl)}${resolvedPath}` : resolvedPath;
}

export function getRawSoulUrl(slug: string, baseUrl: string): string {
  return getRawSoulPath(slug, { baseUrl });
}

export function getQuickInstallCommand(slug: string, baseUrl: string): string {
  return `curl -fsSL ${getRawSoulUrl(slug, baseUrl)} > ${INSTALL_TARGET_PATH}`;
}

export function getBackupCommand(): string {
  return `cp ${INSTALL_TARGET_PATH} ${BACKUP_TARGET_PATH}`;
}
