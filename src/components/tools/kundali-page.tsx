import { Suspense } from 'react';
import { BadgeCheck, LockKeyhole, Orbit } from 'lucide-react';
import { getLocale, getT } from '@/i18n/server';
import { PageShell } from '@/components/common/page-header';
import { KundaliHub, type HubPage } from '@/components/kundali/kundali-hub';
import { JsonLd } from '@/components/seo/json-ld';
import { fetchKundaliLimits } from '@/lib/seo/data';
import { breadcrumbSchema, webApplicationSchema } from '@/lib/seo/schema';
import { ToolArticle } from './tool-article';
import { ToolHero } from './tool-hero';
import { ToolLinks } from './tool-links';

const PATH: Record<HubPage, string> = { kundali: '/kundali', milan: '/kundali-milan' };

/** Server shell of /kundali and /kundali-milan: hero, the client form, explanation, FAQ and cross-links. */
export async function KundaliToolPage({ page }: { page: HubPage }) {
  const [tt, tk, ts, tc, locale, limits] = await Promise.all([
    getT('tools'),
    getT('kundali'),
    getT('seo'),
    getT('common'),
    getLocale(),
    fetchKundaliLimits(),
  ]);
  const path = PATH[page];
  const title = page === 'kundali' ? tt('h1.kundali') : tt('h1.milan');
  const trust = [
    { icon: Orbit, title: tk('trust.precise'), text: tk('trust.preciseText') },
    { icon: BadgeCheck, title: tk('trust.lahiri'), text: tk('trust.lahiriText') },
    { icon: LockKeyhole, title: tk('trust.private'), text: tk('trust.privateText') },
  ];

  return (
    <>
      <JsonLd
        data={[
          webApplicationSchema({
            name: title,
            description: page === 'kundali' ? tk('meta.description') : tt('meta.milan.description'),
            path,
            locale,
            brand: tc('brand.name'),
          }),
          breadcrumbSchema(
            [
              { name: ts('breadcrumb.home'), path: '/' },
              { name: page === 'kundali' ? tt('breadcrumb.kundali') : tt('breadcrumb.milan'), path },
            ],
            locale,
          ),
        ]}
      />
      <ToolHero
        invocation={tk('hero.invocation')}
        title={title}
        lead={page === 'kundali' ? tt('lead.kundali') : tt('lead.milan')}
        trust={trust}
      />
      <PageShell className="pt-8 sm:pt-10">
        <Suspense>
          <KundaliHub page={page} />
        </Suspense>
        <ToolArticle page={page} path={path} vars={limits} className="mt-16" />
        <ToolLinks current={page} className="mt-16" />
      </PageShell>
    </>
  );
}
