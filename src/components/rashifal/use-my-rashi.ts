'use client';

import { useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useApiQuery } from '@/components/customer/use-api';
import { RASHI_EVENT, readSavedRashi, saveRashi, type MyRashi, type RashiSlug } from '@/lib/rashifal';

export type MyRashiState = {
  sign: RashiSlug | null;
  /** Where the sign came from: this device, the reminder settings or the latest kundali. */
  source: 'device' | 'preference' | 'kundali' | null;
  kundaliTitle: string | null;
  choose: (slug: RashiSlug | null) => void;
};

function subscribe(onChange: () => void) {
  window.addEventListener(RASHI_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(RASHI_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * The visitor's rashi: a choice made on this device wins; else, when signed in, the sign in
 * their reminder settings or the moon sign of their latest kundali.
 */
export function useMyRashi(): MyRashiState {
  const { token } = useAuth();
  const local = useSyncExternalStore(subscribe, readSavedRashi, () => null);
  const server = useApiQuery<MyRashi>(token ? '/rashifal/me' : null, { token });
  const remote = token ? server.data : undefined;

  if (local) return { sign: local, source: 'device', kundaliTitle: null, choose: saveRashi };
  if (remote?.sign) {
    return { sign: remote.sign, source: remote.source, kundaliTitle: remote.kundali_title, choose: saveRashi };
  }
  return { sign: null, source: null, kundaliTitle: null, choose: saveRashi };
}
