import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getLocale, getT } from '@/i18n/server';
import { pick } from '@/i18n/translate';
import { PUJA_TOOL_LINKS } from '@/lib/tools';
import type { ServiceDefinition } from '@/lib/types';
import { ShareButtons } from '@/components/share/share-buttons';

/** Under a puja's page: the free tools that help plan it (lib/tools.ts) and share buttons. */
export async function PujaTools({ puja }: { puja: ServiceDefinition }) {
  const [t, tm, locale] = await Promise.all([getT('tools'), getT('muhurat'), getLocale()]);
  const links = PUJA_TOOL_LINKS[puja.slug] ?? [];
  const path = `/pujas/${encodeURIComponent(puja.slug)}`;
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-12 sm:px-6">
      {links.length > 0 && (
        <nav aria-labelledby="puja-tools" className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 id="puja-tools" className="font-heading text-xl text-heading">
            {t('puja.toolsTitle')}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-11 items-center gap-1.5 font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {l.label === 'muhuratKind' ? t('puja.muhuratKind', { kind: tm(`kind.${l.kind}`) }) : t(`puja.${l.label}`)}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <ShareButtons text={t('share.pujaText', { name: pick(puja, 'name', locale) })} path={path} source="puja" />
    </div>
  );
}
