'use client';

import { useEffect } from 'react';

import { trackClientEventOnce } from '@/lib/analytics/client';
import type { AnalyticsEventName, AnalyticsSource } from '@/lib/analytics/schema';

interface AnalyticsViewTrackerProps {
  eventName: AnalyticsEventName;
  slug?: string;
  source: AnalyticsSource;
  placement?: string;
  storageKey: string;
}

export function AnalyticsViewTracker({ eventName, slug, source, placement, storageKey }: AnalyticsViewTrackerProps) {
  useEffect(() => {
    trackClientEventOnce(storageKey, {
      eventName,
      slug,
      source,
      placement,
    });
  }, [eventName, placement, slug, source, storageKey]);

  return null;
}
