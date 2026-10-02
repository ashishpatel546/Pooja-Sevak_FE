'use client';

import { useState } from 'react';
import { Archive, BookOpen, CircleAlert, Pencil, Plus, RotateCcw, Video } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { ServiceDefinition } from '@/lib/types';
import { pick, useFormat, useLocale, useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { PujaIcon } from '@/components/common/puja-icon';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';
import { errorMessage, useApi } from '@/components/dashboard/use-api';
import { CatalogDialog } from '@/components/admin/catalog-dialog';
import { FilterChips } from '@/components/admin/filter-chips';
import { useCategoryLabel } from '@/components/dashboard/category';

type Filter = 'all' | 'active' | 'inactive';

export default function AdminCatalogPage() {
  const { token } = useAuth();
  const t = useT('admin');
  const tc = useT('common');
  const f = useFormat();
  const { locale } = useLocale();
  const categoryLabel = useCategoryLabel();
  const nameOf = (d: ServiceDefinition) => pick(d, 'name', locale);
  const defs = useApi<ServiceDefinition[]>('/service-definitions?includeInactive=true', token);
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<ServiceDefinition | null>(null);
  const [adding, setAdding] = useState(false);
  const [archiving, setArchiving] = useState<ServiceDefinition | null>(null);

  const all = [...(defs.data ?? [])].sort(
    (a, b) =>
      categoryLabel(a.category).localeCompare(categoryLabel(b.category), locale) ||
      nameOf(a).localeCompare(nameOf(b), locale),
  );
  const list = all.filter((d) => (filter === 'all' ? true : filter === 'active' ? d.is_active : !d.is_active));

  const upsert = (d: ServiceDefinition) =>
    defs.mutate((l) => {
      const arr = l ?? [];
      return arr.some((x) => x.id === d.id) ? arr.map((x) => (x.id === d.id ? { ...x, ...d } : x)) : [...arr, d];
    });

  const archive = async () => {
    if (!archiving) return;
    try {
      await api(`/service-definitions/${archiving.id}`, { method: 'DELETE', token });
      upsert({ ...archiving, is_active: false });
      toast.success(t('catalog.toast.archived', { name: nameOf(archiving) }));
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    }
  };

  const restore = async (d: ServiceDefinition) => {
    try {
      const saved = await api<ServiceDefinition>(`/service-definitions/${d.id}`, {
        method: 'PUT',
        token,
        body: { is_active: true },
      });
      upsert({ ...d, ...saved, is_active: true });
      toast.success(t('catalog.toast.restored', { name: nameOf(d) }));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader
        title={t('catalog.title')}
        description={t('catalog.desc')}
        actions={
          <Button size="lg" onClick={() => setAdding(true)}>
            <Plus aria-hidden="true" /> {t('catalog.add')}
          </Button>
        }
      />

      <div className="mb-6">
        <FilterChips<Filter>
          label={t('catalog.filterLabel')}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('filter.all'), count: defs.data ? all.length : undefined },
            { value: 'active', label: t('catalog.filter.active'), count: defs.data ? all.filter((d) => d.is_active).length : undefined },
            { value: 'inactive', label: t('catalog.filter.archived'), count: defs.data ? all.filter((d) => !d.is_active).length : undefined },
          ]}
        />
      </div>

      {defs.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : defs.error && !defs.data ? (
        <EmptyState icon={CircleAlert} title={t('catalog.loadError')} action={<Button onClick={defs.reload}>{tc('action.retry')}</Button>}>
          {defs.error}
        </EmptyState>
      ) : list.length === 0 ? (
        <EmptyState icon={BookOpen} title={t('catalog.empty.title')}>
          {filter === 'inactive' ? t('catalog.empty.archived') : t('catalog.empty.body')}
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => (
            <li key={d.id} className={cn('flex flex-col rounded-xl border bg-card p-4', !d.is_active && 'bg-muted/40')}>
              <div className="flex items-start gap-3">
                <PujaIcon category={d.category} size="sm" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg leading-tight break-words">{nameOf(d)}</h2>
                  {locale === 'hi' && d.name_hi && <p className="text-xs text-muted-foreground">{d.name}</p>}
                  <p className="text-xs break-all text-muted-foreground">
                    {categoryLabel(d.category)} · /{d.slug}
                  </p>
                  {!d.name_hi && (
                    <p className="mt-1 text-xs font-medium text-accent-foreground">{t('catalog.noHindi')}</p>
                  )}
                </div>
                {!d.is_active && (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border">
                    {t('catalog.archivedBadge')}
                  </span>
                )}
              </div>
              {pick(d, 'tagline', locale) && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{pick(d, 'tagline', locale)}</p>
              )}
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t('catalog.from')}</dt>
                  <dd className="font-medium">{d.starting_price != null ? f.inr(d.starting_price) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('catalog.pandits')}</dt>
                  <dd className="font-medium">{Number(d.pandit_count) || 0}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('catalog.typical')}</dt>
                  <dd>{f.duration(Number(d.typical_duration_minutes)) || '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('catalog.online')}</dt>
                  <dd className="inline-flex items-center gap-1">
                    {d.supports_online ? (
                      <>
                        <Video className="size-3.5" aria-hidden="true" /> {t('catalog.yes')}
                      </>
                    ) : (
                      t('catalog.no')
                    )}
                  </dd>
                </div>
              </dl>
              <div className="mt-auto flex flex-wrap justify-end gap-1 pt-3">
                <Button variant="ghost" onClick={() => setEditing(d)} aria-label={t('catalog.editAria', { name: nameOf(d) })}>
                  <Pencil aria-hidden="true" /> {t('catalog.edit')}
                </Button>
                {d.is_active ? (
                  <Button
                    variant="ghost"
                    onClick={() => setArchiving(d)}
                    aria-label={t('catalog.archiveAria', { name: nameOf(d) })}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Archive aria-hidden="true" /> {t('catalog.archive')}
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => restore(d)} aria-label={t('catalog.restoreAria', { name: nameOf(d) })}>
                    <RotateCcw aria-hidden="true" /> {t('catalog.restore')}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <CatalogDialog open={adding} onOpenChange={setAdding} token={token} onSaved={upsert} />
      <CatalogDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        token={token}
        definition={editing ?? undefined}
        onSaved={upsert}
      />
      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(o) => !o && setArchiving(null)}
        destructive
        title={t('catalog.dialog.title', { name: archiving ? nameOf(archiving) : t('catalog.thisPuja') })}
        description={t('catalog.dialog.desc')}
        confirmLabel={t('catalog.dialog.confirm')}
        cancelLabel={t('catalog.dialog.keep')}
        onConfirm={archive}
      />
    </>
  );
}
