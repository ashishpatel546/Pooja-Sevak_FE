import type { ReactNode } from 'react';
import { PageHeader, PageShell } from '@/components/common/page-header';
import { Prose } from './prose';

export type DocSection = { id: string; title: string; body: string; extra?: ReactNode };

/**
 * Long-form page (terms, privacy, refund policy): one h1, a "last updated"
 * line, a table of contents (sticky beside the text on wide screens, above it
 * on phones) and numbered h2 sections at a comfortable reading measure.
 */
export function LegalDocument({
  title,
  intro,
  updated,
  tocLabel,
  sections,
  nodes,
}: {
  title: string;
  intro?: string;
  /** e.g. "Last updated: <time>…</time>" */
  updated: ReactNode;
  tocLabel: string;
  sections: DocSection[];
  nodes?: Record<string, ReactNode>;
}) {
  return (
    <PageShell>
      <PageHeader
        title={title}
        description={<span className="block text-sm">{updated}</span>}
        className="mb-6"
      />
      <div className="toran mb-10 max-w-[70ch]" aria-hidden="true" />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,70ch)_15rem] lg:justify-between">
        <nav
          aria-labelledby="toc-title"
          className="self-start rounded-2xl border bg-chandan p-5 lg:sticky lg:top-24 lg:order-2 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto"
        >
          <h2 id="toc-title" className="font-sans text-sm font-semibold text-heading">
            {tocLabel}
          </h2>
          <ol className="mt-3 space-y-1 text-sm">
            {sections.map((s, i) => (
              <li key={s.id} className="flex items-baseline gap-2">
                <span className="w-5 shrink-0 py-1 text-end text-muted-foreground tabular-nums" aria-hidden="true">
                  {i + 1}.
                </span>
                <a
                  href={`#${s.id}`}
                  className="block py-1 text-foreground/85 underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="min-w-0 lg:order-1">
          {intro && (
            <div className="space-y-4 text-lg leading-relaxed text-foreground/90">
              <Prose text={intro} nodes={nodes} />
            </div>
          )}
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="mt-10 scroll-mt-24">
              <h2 id={`${s.id}-h`} className="text-2xl sm:text-[1.7rem]">
                <span className="me-2 text-primary/80" aria-hidden="true">
                  {i + 1}.
                </span>
                {s.title}
              </h2>
              <div className="mt-3 space-y-4 leading-relaxed text-foreground/90">
                <Prose text={s.body} nodes={nodes} />
                {s.extra}
              </div>
            </section>
          ))}
        </article>
      </div>
    </PageShell>
  );
}
