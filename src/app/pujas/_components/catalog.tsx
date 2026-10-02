'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, SearchX, X } from 'lucide-react';
import type { ServiceDefinition } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import { CATEGORY_META, useCategoryLabel } from '@/components/common/puja-icon';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader, PageShell } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PujaFeatureTile, PujaTile } from '@/components/customer/puja-tile';
import { useApiQuery } from '@/components/customer/use-api';

const CATEGORIES = Object.keys(CATEGORY_META);

function CatalogSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function Catalog({ initial }: { initial: ServiceDefinition[] | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const rawCategory = params.get('category');
  const category = rawCategory && CATEGORIES.includes(rawCategory) ? rawCategory : null;
  const [q, setQ] = useState('');
  const t = useT('catalog');
  const tc = useT('common');
  const categoryText = useCategoryLabel();
  // Server-rendered list when the server could reach the API; otherwise fetch here.
  const query = useApiQuery<ServiceDefinition[]>(initial ? null : '/service-definitions');
  const data = initial ?? query.data;
  const { loading, error, reload } = query;

  const setCategory = (c: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (c) next.set('category', c);
    else next.delete('category');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? [])
      .filter((p) => p.is_active !== false)
      .filter((p) => !category || p.category === category)
      .filter(
        (p) =>
          !needle ||
          [p.name, p.name_hi, p.deity, p.tagline, p.tagline_hi].some((v) =>
            (v ?? '').toLowerCase().includes(needle),
          ),
      );
  }, [data, category, q]);

  const showFeatured = !q.trim() && filtered.length >= 4;
  // Lead with the pujas families book most; fall back to catalog order.
  const featured = showFeatured
    ? [
        ...FEATURED_SLUGS.map((slug) => filtered.find((p) => p.slug === slug)).filter(
          (p): p is NonNullable<typeof p> => !!p,
        ),
        ...filtered.filter((p) => !FEATURED_SLUGS.includes(p.slug)),
      ].slice(0, 3)
    : [];
  const rest = showFeatured ? filtered.filter((p) => !featured.includes(p)) : filtered;

  const chip = (label: string, value: string | null) => {
    const active = category === value;
    return (
      <button
        key={value ?? 'all'}
        type="button"
        aria-pressed={active}
        onClick={() => setCategory(value)}
        className={cn(
          'inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
          active
            ? 'border-primary bg-primary text-primary-foreground'
            : 'bg-card hover:border-primary/40 hover:bg-accent/40',
        )}
      >
        {value && (() => {
          const Icon = CATEGORY_META[value].icon;
          return <Icon className="size-4" aria-hidden="true" />;
        })()}
        {label}
      </button>
    );
  };

  return (
    <PageShell size="wide">
      <PageHeader
        title={t('browse.title')}
        description={t('browse.description')}
      />

      <div className="mb-8 grid gap-4">
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="puja-search" className="sr-only">
            {t('browse.searchLabel')}
          </label>
          <Input
            id="puja-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('browse.searchPlaceholder')}
            className="pr-10 pl-9"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label={t('browse.clearSearch')}
              className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <div
          role="group"
          aria-label={t('browse.filterLabel')}
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          {chip(t('category.all'), null)}
          {CATEGORIES.map((c) => chip(categoryText.label(c), c))}
        </div>
        {category && (
          <p className="text-sm text-muted-foreground">{categoryText.blurb(category)}</p>
        )}
      </div>

      {loading ? (
        <CatalogSkeleton />
      ) : error ? (
        <EmptyState
          icon={SearchX}
          title={t('browse.loadError')}
          action={<Button onClick={reload}>{tc('action.retry')}</Button>}
        >
          {error}
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={q ? t('browse.noMatch', { q: q.trim() }) : t('browse.noneInCategory')}
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQ('');
                setCategory(null);
              }}
            >
              {t('browse.showAll')}
            </Button>
          }
        >
          {t('browse.emptyHint')}
        </EmptyState>
      ) : (
        <div className="grid gap-10">
          {featured.length > 0 && (
            <section aria-labelledby="featured-h">
              <h2 id="featured-h" className="sr-only">
                {t('browse.featured')}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((p, i) => (
                  <PujaFeatureTile
                    key={p.id}
                    puja={p}
                    className={cn(i === 0 && 'md:col-span-2 lg:col-span-1 lg:row-span-1')}
                  />
                ))}
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section aria-labelledby="all-h">
              <h2 id="all-h" className={cn('mb-4 text-2xl', !showFeatured && 'sr-only')}>
                {t('browse.more')}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => (
                  <li key={p.id}>
                    <PujaTile puja={p} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="text-center text-sm text-muted-foreground">
            {t('browse.unsure')}{' '}
            <Link href="/browse" className="font-medium text-primary underline-offset-4 hover:underline">
              {t('browse.askPandit')}
            </Link>
          </p>
        </div>
      )}
    </PageShell>
  );
}

const FEATURED_SLUGS = ['satyanarayan-katha', 'griha-pravesh', 'rudrabhishek'];

export function PujaCatalog({ initial }: { initial: ServiceDefinition[] | null }) {
  return (
    <Suspense fallback={<PageShell size="wide"><CatalogSkeleton /></PageShell>}>
      <Catalog initial={initial} />
    </Suspense>
  );
}
