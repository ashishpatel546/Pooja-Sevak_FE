import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import { kindFromParam, parseFrom, pujaNamesOf } from '@/lib/muhurat';
import { fetchCatalogList } from '@/lib/seo/data';
import { publicMetadata } from '@/lib/seo/metadata';
import { MuhuratFinder } from '@/components/muhurat/muhurat-finder';
import { KindLinks } from '@/components/muhurat/kind-links';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('muhurat');
  return publicMetadata({ path: '/muhurat', title: t('meta.title'), description: t('meta.description') });
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** `?kind=` (vivah, griha-pravesh, mundan, …) and `?from=YYYY-MM-DD` prefill the finder. */
export default async function MuhuratPage({ searchParams }: Props) {
  const [query, catalog] = await Promise.all([searchParams, fetchCatalogList()]);
  return (
    <>
      <MuhuratFinder kind={kindFromParam(query.kind)} from={parseFrom(query.from)} pujaNames={pujaNamesOf(catalog)} />
      <div className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
        <KindLinks />
      </div>
    </>
  );
}
