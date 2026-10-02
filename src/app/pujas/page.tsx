import type { Metadata } from 'next';
import { getLocale, getT } from '@/i18n/server';
import { JsonLd } from '@/components/seo/json-ld';
import { fetchCatalogList } from '@/lib/seo/data';
import { publicMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, catalogListSchema } from '@/lib/seo/schema';
import { PujaCatalog } from './_components/catalog';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('catalog');
  return publicMetadata({ path: '/pujas', title: t('meta.pujas.title'), description: t('meta.pujas.description') });
}

export default async function PujasPage() {
  const [catalog, locale, t] = await Promise.all([fetchCatalogList(), getLocale(), getT('seo')]);
  const active = catalog?.filter((p) => p.is_active !== false) ?? null;
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(
            [
              { name: t('breadcrumb.home'), path: '/' },
              { name: t('breadcrumb.pujas'), path: '/pujas' },
            ],
            locale,
          ),
          ...(active?.length ? [catalogListSchema(active, locale)] : []),
        ]}
      />
      <PujaCatalog initial={active} />
    </>
  );
}
