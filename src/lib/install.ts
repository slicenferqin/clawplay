export const INSTALL_TARGET_PATH = '~/.openclaw/workspace/SOUL.md';
export const BACKUP_TARGET_PATH = '~/.openclaw/workspace/SOUL.backup.md';
export const SITE_URL_PLACEHOLDER = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://your-clawplay-domain.com';

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

export function getRawSoulUrl(slug: string, baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}/api/raw/${slug}`;
}

export function getQuickInstallCommand(slug: string, baseUrl: string): string {
  return `curl -fsSL ${getRawSoulUrl(slug, baseUrl)} > ${INSTALL_TARGET_PATH}`;
}

export function getBackupCommand(): string {
  return `cp ${INSTALL_TARGET_PATH} ${BACKUP_TARGET_PATH}`;
}
