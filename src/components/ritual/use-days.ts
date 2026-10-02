'use client';

import { useMemo } from 'react';
import { useT } from '@/i18n';
import { daysUntilIn } from '@/lib/format';
import { IST_ZONE } from '@/lib/place';

/**
 * Day arithmetic in the panchang place's own zone: a Toronto evening is
 * already "tomorrow" in India, so "today" must come from `tz`, not IST.
 */
export function useDays(tz: string = IST_ZONE) {
  const t = useT('common');
  return useMemo(() => {
    const until = (key: string) => daysUntilIn(key, tz);
    /** "Today", "Tomorrow", "in 5 days" for a YYYY-MM-DD key. */
    const relative = (key: string) => {
      const n = until(key);
      if (n === 0) return t('time.today');
      if (n === 1) return t('time.tomorrow');
      return t.plural('time.inDays', n);
    };
    return { until, relative };
  }, [t, tz]);
}
