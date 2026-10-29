'use client';

import { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import { useFormat, useT } from '@/i18n';
import { api } from '@/lib/api';
import { readRef, storeRef } from '@/lib/referral';

/** "₹101 off your first puja" on the signup page when the visitor came with a valid ?ref. */
export function ReferralSignupNote({ className }: { className?: string }) {
  const t = useT('growth');
  const f = useFormat();
  const [reward, setReward] = useState<number | null>(null);

  useEffect(() => {
    // RefCapture may not have run yet on a direct /signup?ref= visit.
    const fromUrl = new URLSearchParams(window.location.search).get('ref');
    if (fromUrl) storeRef(fromUrl);
    const code = readRef();
    if (!code) return;
    let cancelled = false;
    api<{ valid: boolean; reward_paise: number }>(`/referrals/code/${encodeURIComponent(code)}`)
      .then((r) => !cancelled && r.valid && setReward(r.reward_paise))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!reward) return null;
  return (
    <p
      role="status"
      className={`flex items-center gap-2 rounded-xl border border-diya/40 bg-diya/10 px-4 py-3 text-sm font-medium ${className ?? ''}`}
    >
      <Gift className="size-5 shrink-0 text-diya" aria-hidden="true" />
      {t('signup.refBanner', { amount: f.inr(reward / 100) })}
    </p>
  );
}
