'use client';

import type { ReactNode } from 'react';
import { Mandala } from '@/components/brand/mandala';
import { firstName } from '@/lib/format';
import { useFormat, useT } from '@/i18n';

/** Twilight welcome band at the top of the dashboard. One per page. */
export function WelcomeBand({
  name,
  line,
  pandit = false,
  children,
}: {
  name: string;
  line: ReactNode;
  /** Pandits are greeted as "पंडित … जी" in Hindi. */
  pandit?: boolean;
  children?: ReactNode;
}) {
  const t = useT('dashboard');
  const f = useFormat();
  const first = firstName(name) || name;
  return (
    <section className="sandhya stars relative overflow-hidden rounded-3xl px-6 py-9 sm:px-10 sm:py-12">
      <Mandala className="absolute -top-24 -right-24 size-80 text-diya/20 sm:-right-10 sm:size-[26rem]" />
      <div className="relative max-w-2xl min-w-0">
        <h1 className="text-3xl leading-tight break-words sm:text-5xl">
          {t(pandit ? 'welcome.titlePandit' : 'welcome.title', { greeting: f.greeting(), name: first })}
        </h1>
        <p className="mt-3 text-base sm:text-lg">{line}</p>
        {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}
