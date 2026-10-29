import Link from 'next/link';
import { getT } from '@/i18n/server';
import { kindRoute, MUHURAT_KINDS, type MuhuratKind } from '@/lib/muhurat';

/** Links to every /muhurat/[kind] page (the hub's list, or "other muhurats" on a kind page). */
export async function KindLinks({ current }: { current?: MuhuratKind }) {
  const t = await getT('muhurat');
  return (
    <nav aria-labelledby="muhurat-kinds">
      <h2 id="muhurat-kinds" className="text-2xl">
        {current ? t('page.otherKinds') : t('hub.title')}
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MUHURAT_KINDS.filter((k) => k !== current).map((k) => (
          <li key={k}>
            <Link
              href={`/muhurat/${kindRoute(k)}`}
              className="flex h-full flex-col rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="font-medium">{t('page.h1', { kind: t(`kind.${k}`) })}</span>
              <span className="text-sm text-muted-foreground">{t(`kindDesc.${k}`)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
