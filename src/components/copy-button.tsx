'use client';

import { useEffect, useRef, useState } from 'react';

import { CopyIcon } from '@/components/icons';
import { trackClientEvent } from '@/lib/analytics/client';
import type { AnalyticsEventName, AnalyticsMeta, AnalyticsSource } from '@/lib/analytics/schema';

interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: 'light' | 'dark';
  analyticsEventName?: AnalyticsEventName;
  analyticsSource?: AnalyticsSource;
  analyticsPlacement?: string;
  analyticsSlug?: string;
  analyticsMeta?: AnalyticsMeta;
}

type CopyState = 'idle' | 'success' | 'error';

function fallbackCopyText(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

export function CopyButton({
  text,
  label = '复制',
  variant = 'light',
  analyticsEventName,
  analyticsSource,
  analyticsPlacement,
  analyticsSlug,
  analyticsMeta,
}: CopyButtonProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function resetLater() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => setCopyState('idle'), 1800);
  }

  async function handleCopy() {
    let copied = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      } else {
        copied = fallbackCopyText(text);
      }
    } catch {
      copied = fallbackCopyText(text);
    }

    if (copied && analyticsEventName && analyticsSource) {
      trackClientEvent({
        eventName: analyticsEventName,
        slug: analyticsSlug,
        source: analyticsSource,
        placement: analyticsPlacement,
        meta: analyticsMeta,
      });
    }

    setCopyState(copied ? 'success' : 'error');
    resetLater();
  }

  const buttonLabel = copyState === 'success' ? '已复制' : copyState === 'error' ? '复制失败' : label;

  return (
    <button
      type="button"
      className={`copy-button copy-button--${variant}`}
      onClick={handleCopy}
      aria-live="polite"
    >
      <CopyIcon className="copy-button__icon" />
      <span>{buttonLabel}</span>
    </button>
  );
}
