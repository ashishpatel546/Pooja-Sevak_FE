'use client';

import { useCallback } from 'react';
import { useT } from '@/i18n';
import { ApiError } from '@/lib/api';

/**
 * Turns anything thrown by `api()` into a sentence in the visitor's language.
 * Validation and conflict messages from the server are specific, so they are
 * kept; everything else uses the caller's localized fallback.
 */
export function useErrorText() {
  const t = useT('common');
  return useCallback(
    (e: unknown, fallback: string) => {
      if (e instanceof TypeError) return t('state.offline');
      if (e instanceof ApiError && [400, 409, 422].includes(e.status) && e.message) return e.message;
      return fallback;
    },
    [t],
  );
}
