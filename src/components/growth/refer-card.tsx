'use client';

import Link from 'next/link';
import { ArrowRight, Gift } from 'lucide-react';
import { useFormat, useT } from '@/i18n';
import type { ReferralMe } from '@/lib/types';
import { useApiQuery } from '@/components/customer/use-api';
import { cn } from '@/lib/utils';

/** Link card to /refer ("Refer & earn ₹101"); hidden while the programme is off. */
export function ReferCard({ token, className }: { token: string | null; className?: string }) {
  const t = useT('growth');
  const f = useFormat();
  const me = useApiQuery<ReferralMe>(token ? '/referrals/me' : null, { token });
  if (!me.data?.enabled) return null;
  const amount = f.inr(me.data.reward_paise / 100);
  return (
    <Link
      href="/refer"
      className={cn(
        'group flex items-center gap-4 rounded-2xl border border-diya/40 bg-gradient-to-r from-diya/10 to-accent/30 p-5 transition-colors hover:border-diya focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        className,
      )}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-diya/20 text-diya">
        <Gift className="size-6" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-medium">{t('refer.link.cta', { amount })}</span>
        <span className="block text-sm text-muted-foreground">{t('refer.link.body', { amount })}</span>
      </span>
      <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}
