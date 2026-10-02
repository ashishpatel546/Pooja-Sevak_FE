'use client';

import Link from 'next/link';
import { Smartphone } from 'lucide-react';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';

/** Gentle nudge to verify a mobile number. */
export function MobilePrompt({ role }: { role: 'customer' | 'pandit' | 'admin' }) {
  const t = useT('dashboard');
  const why = role === 'pandit' ? t('mobile.why.pandit') : t('mobile.why.customer');
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-diya/40 bg-accent/60 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-accent-foreground ring-1 ring-diya/40">
          <Smartphone className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-medium text-accent-foreground">{t('mobile.title')}</p>
          <p className="text-sm text-muted-foreground">{why}</p>
        </div>
      </div>
      <Button
        variant="outline"
        className="shrink-0 self-start sm:self-auto"
        render={<Link href="/verify-mobile?next=/dashboard" />}
        nativeButton={false}
      >
        {t('mobile.cta')}
      </Button>
    </div>
  );
}
