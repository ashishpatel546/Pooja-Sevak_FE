'use client';

import { Diya } from '@/components/brand/diya';
import { useT } from '@/i18n';

/** Full-section loading state: a lit diya with a short line of copy. */
export function DiyaLoader({ label }: { label?: string }) {
  const t = useT('customer');
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 px-4 py-24 text-center text-muted-foreground">
      <Diya className="size-14" />
      <p className="text-sm text-balance">{label ?? t('loading.default')}</p>
    </div>
  );
}
