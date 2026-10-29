'use client';

import Link from 'next/link';
import { CalendarHeart, Flower2, HandHeart } from 'lucide-react';
import { pick, useLocale, useT } from '@/i18n';
import type { Dosha, ShaniPeriod } from '@/lib/kundali';
import { DOSHA_REMEDY_PUJAS, muhuratHref, SHANI_REMEDY_PUJAS, shaniRunning, VIVAH_PUJA_SLUG } from '@/lib/tools';
import type { ServiceDefinition } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useApiQuery } from '@/components/customer/use-api';

/** Milan → a vivah muhurat → book the vivah puja. */
export function MilanNextSteps() {
  const tt = useT('tools');
  return (
    <section
      aria-labelledby="milan-next"
      className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 print:hidden"
    >
      <h2 id="milan-next" className="font-heading text-xl text-heading">
        {tt('flow.milanTitle')}
      </h2>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" render={<Link href={muhuratHref('vivah')} />} nativeButton={false}>
          <CalendarHeart aria-hidden="true" />
          {tt('flow.milanMuhurat')}
        </Button>
        <Button render={<Link href={`/pujas/${VIVAH_PUJA_SLUG}`} />} nativeButton={false}>
          <HandHeart aria-hidden="true" />
          {tt('flow.milanBook')}
        </Button>
      </div>
    </section>
  );
}

/**
 * Pujas traditionally done for the doshas present in a kundali and a running Shani
 * period (sade sati, kantak, ashtam) — lib/tools.ts —
 * limited to pujas that exist and are active in the live catalog.
 */
export function DoshaRemedies({ doshas, shani }: { doshas: Dosha[]; shani?: ShaniPeriod[] }) {
  const tt = useT('tools');
  const { locale } = useLocale();
  const wanted = [
    ...new Set([
      ...doshas.filter((d) => d.present && !d.cancelled).flatMap((d) => DOSHA_REMEDY_PUJAS[d.key] ?? []),
      ...(shaniRunning(shani) ? SHANI_REMEDY_PUJAS : []),
    ]),
  ];
  const catalog = useApiQuery<ServiceDefinition[]>(wanted.length ? '/service-definitions' : null);
  const pujas = wanted
    .map((slug) => catalog.data?.find((p) => p.slug === slug && p.is_active !== false))
    .filter((p): p is ServiceDefinition => !!p);
  if (!pujas.length) return null;

  return (
    <section aria-labelledby="dosha-remedies" className="rounded-2xl border bg-card p-5 sm:p-6 print:hidden">
      <h2 id="dosha-remedies" className="flex items-center gap-2 font-heading text-xl text-heading">
        <Flower2 className="size-5 text-primary" aria-hidden="true" />
        {tt('flow.remedyTitle')}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{tt('flow.remedyText')}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {pujas.map((p) => (
          <li key={p.slug}>
            <Button variant="outline" render={<Link href={`/pujas/${encodeURIComponent(p.slug)}`} />} nativeButton={false}>
              {pick(p, 'name', locale)}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
