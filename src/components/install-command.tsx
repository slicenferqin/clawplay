'use client';

import { useEffect, useMemo, useState } from 'react';

import { CopyButton } from '@/components/copy-button';
import { SITE_URL_PLACEHOLDER, getQuickInstallCommand } from '@/lib/install';
import type { AnalyticsEventName, AnalyticsMeta, AnalyticsSource } from '@/lib/analytics/schema';

interface InstallCommandProps {
  slug: string;
  showCode?: boolean;
  showCopyButton?: boolean;
  codeClassName?: string;
  copyLabel?: string;
  copyVariant?: 'light' | 'dark';
  analyticsEventName?: AnalyticsEventName;
  analyticsSource?: AnalyticsSource;
  analyticsPlacement?: string;
  analyticsMeta?: AnalyticsMeta;
}

export function InstallCommand({
  slug,
  showCode = true,
  showCopyButton = false,
  codeClassName,
  copyLabel = '复制命令',
  copyVariant = 'light',
  analyticsEventName,
  analyticsSource,
  analyticsPlacement,
  analyticsMeta,
}: InstallCommandProps) {
  const [origin, setOrigin] = useState(SITE_URL_PLACEHOLDER);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const command = useMemo(() => getQuickInstallCommand(slug, origin), [origin, slug]);

  return (
    <>
      {showCode ? <code className={codeClassName}>{command}</code> : null}
      {showCopyButton ? (
        <CopyButton
          text={command}
          label={copyLabel}
          variant={copyVariant}
          analyticsEventName={analyticsEventName}
          analyticsSource={analyticsSource}
          analyticsPlacement={analyticsPlacement}
          analyticsSlug={slug}
          analyticsMeta={analyticsMeta}
        />
      ) : null}
    </>
  );
}
