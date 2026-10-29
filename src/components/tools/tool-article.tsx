import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { getLocale, getT } from '@/i18n/server';
import type { Messages } from '@/i18n/messages';
import type { Vars } from '@/i18n/translate';
import { JsonLd } from '@/components/seo/json-ld';
import { faqPageSchema } from '@/lib/seo/schema';
import { cn } from '@/lib/utils';

type ToolsKey = keyof Messages['tools'] & string;
type Page = 'kundali' | 'milan' | 'muhurat';

/** Explanatory sections (heading + paragraphs, or a list) and FAQ ids per page, in the tools namespace. */
const CONTENT: Record<Page, { sections: { id: string; paras?: string[]; list?: string[] }[]; faqs: string[] }> = {
  kundali: {
    sections: [
      { id: 'what', paras: ['p1', 'p2'] },
      { id: 'includes', paras: ['p1'] },
      { id: 'how', paras: ['p1', 'p2'] },
      { id: 'free', paras: ['p1'] },
      { id: 'privacy', paras: ['p1'] },
    ],
    faqs: ['free', 'time', 'ayanamsa', 'manglik', 'language', 'newborn', 'privacy'],
  },
  milan: {
    sections: [
      { id: 'what', paras: ['p1'] },
      { id: 'koots', list: ['varna', 'vashya', 'tara', 'yoni', 'graha_maitri', 'gana', 'bhakoot', 'nadi'] },
      { id: 'score', paras: ['p1'] },
      { id: 'doshas', paras: ['p1', 'p2'] },
      { id: 'guidance', paras: ['p1'] },
    ],
    faqs: ['free', 'good', 'name', 'nadi', 'manglik', 'privacy'],
  },
  muhurat: {
    sections: [
      { id: 'what', paras: ['p1'] },
      { id: 'vivah', paras: ['p1'] },
      { id: 'griha', paras: ['p1'] },
      { id: 'day', paras: ['p1'] },
      { id: 'pandit', paras: ['p1'] },
    ],
    faqs: ['free', 'city', 'none', 'choghadiya', 'rahu', 'final'],
  },
};

/**
 * Server-rendered explanation and FAQ for a tool page (crawlable, in the page's
 * language), with FAQPage JSON-LD built from the same text. `children` is placed
 * after the explanation (e.g. the muhurat dates list).
 */
export async function ToolArticle({
  page,
  path,
  vars,
  children,
  className,
}: {
  page: Page;
  path: string;
  vars?: Vars;
  children?: ReactNode;
  className?: string;
}) {
  const [t, locale] = await Promise.all([getT('tools'), getLocale()]);
  const k = (key: string) => t(`${page}.${key}` as ToolsKey, vars);
  const { sections, faqs } = CONTENT[page];
  const qa = faqs.map((id) => ({ id, question: k(`faq.${id}.q`), answer: k(`faq.${id}.a`) }));

  return (
    <div className={cn('grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16', className)}>
      <JsonLd data={faqPageSchema(qa, locale, path)} />
      <article aria-labelledby={`${page}-about`} className="max-w-[70ch]">
        <h2 id={`${page}-about`} className="sr-only">
          {t('about.title')}
        </h2>
        {sections.map((s) => (
          <section key={s.id} className="mt-8 first:mt-0">
            <h3 className="font-heading text-2xl text-heading">{k(`${s.id}.h`)}</h3>
            {s.paras?.map((p) => (
              <p key={p} className="mt-3 leading-relaxed text-foreground/90">
                {k(`${s.id}.${p}`)}
              </p>
            ))}
            {s.list && (
              <ul className="mt-3 grid gap-1.5">
                {s.list.map((item) => (
                  <li key={item} className="flex gap-2 leading-relaxed text-foreground/90">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-diya" />
                    {k(`${s.id}.${item}`)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
        {children}
      </article>

      <section aria-labelledby={`${page}-faq`}>
        <h2 id={`${page}-faq`} className="font-heading text-2xl text-heading sm:text-3xl">
          {t('faq.title')}
        </h2>
        <div className="mt-4 divide-y rounded-2xl border bg-card">
          {qa.map(({ id, question, answer }) => (
            <details key={id} id={`faq-${id}`} className="group scroll-mt-24 px-5">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium text-heading marker:hidden focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                <span>{question}</span>
                <ChevronDown
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </summary>
              <p className="pb-5 leading-relaxed text-foreground/90">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
