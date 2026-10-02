'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CircleAlert,
  Feather,
  FileText,
  ImageIcon,
  IndianRupee,
  ListPlus,
  Package,
  Pencil,
  Trash2,
  TriangleAlert,
  Upload,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/use-require-auth';
import type { PanditServiceItem, SamagriList, ServiceDefinition } from '@/lib/types';
import { lighterListMissing, offersLighter, samagriKitPriceFor } from '@/lib/samagri';
import { pick, useFormat, useLocale, useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, PageShell } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { PujaIcon } from '@/components/common/puja-icon';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';
import { Switch } from '@/components/dashboard/switch';
import { errorMessage, useApi } from '@/components/dashboard/use-api';
import { ServiceDialog } from '@/components/pandit/service-dialog';
import { SamagriListButton } from '@/components/common/samagri-list';

export default function PanditServicesPage() {
  const { ready, token } = useRequireAuth(['pandit']);
  const t = useT('pandit');
  const ts = useT('samagri');
  const tc = useT('common');
  const f = useFormat();
  const { locale } = useLocale();
  const services = useApi<PanditServiceItem[]>(ready ? '/pandits/me/services' : null, token);
  const catalog = useApi<ServiceDefinition[]>(ready ? '/service-definitions' : null, token);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<PanditServiceItem | null>(null);
  const [deleting, setDeleting] = useState<PanditServiceItem | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const mine = services.data ?? [];
  const taken = new Set(mine.map((s) => s.service_definition_id));
  const available = (catalog.data ?? []).filter((d) => d.is_active && !taken.has(d.id));
  const defById = new Map((catalog.data ?? []).map((d) => [d.id, d]));
  // Older pujas may predate mandatory lists; they stay bookable but need one.
  const missingLists = mine.filter((s) => !s.samagri_list).length;
  // Pujas offering the shorter version without its own list (families see the full list meanwhile).
  const missingLighter = mine.filter((s) => s.samagri_list && lighterListMissing(s)).length;
  const withDef = (s: PanditServiceItem) => ({ ...s, service_definition: s.service_definition ?? defById.get(s.service_definition_id) });

  const upsert = (s: PanditServiceItem) =>
    services.mutate((list) => {
      const l = list ?? [];
      return l.some((x) => x.id === s.id) ? l.map((x) => (x.id === s.id ? { ...x, ...s } : x)) : [...l, s];
    });

  const toggleActive = async (s: PanditServiceItem, next: boolean) => {
    setToggling(s.id);
    upsert({ ...s, is_active: next });
    try {
      await api(`/pandits/me/services/${s.id}`, { method: 'PUT', token, body: { is_active: next } });
      toast.success(next ? t('services.toast.resumed') : t('services.toast.paused'));
    } catch (e) {
      upsert({ ...s, is_active: !next });
      toast.error(errorMessage(e));
    } finally {
      setToggling(null);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      const res = await api<{ success?: boolean; deactivated?: boolean } | null>(
        `/pandits/me/services/${deleting.id}`,
        { method: 'DELETE', token },
      );
      if (res?.deactivated) {
        upsert({ ...deleting, is_active: false });
        toast.success(t('services.toast.deactivated'));
      } else {
        services.mutate((l) => (l ?? []).filter((x) => x.id !== deleting.id));
        toast.success(t('services.toast.removed'));
      }
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    }
  };

  // The link sits inside a translated sentence: "… see Earnings on your {link}."
  const [feeBefore, feeAfter = ''] = t('services.feeNote').split('{link}');

  const addButton = (
    <Button size="lg" onClick={() => setAdding(true)} disabled={catalog.loading}>
      <ListPlus aria-hidden="true" /> {t('services.add')}
    </Button>
  );

  return (
    <PageShell>
      <PageHeader
        back={
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" /> {t('nav.dashboard')}
          </Link>
        }
        title={t('services.title')}
        description={t('services.desc')}
        actions={mine.length ? addButton : undefined}
      />

      {!ready || services.loading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : services.error && !services.data ? (
        <EmptyState icon={CircleAlert} title={t('services.loadError')} action={<Button onClick={services.reload}>{tc('action.retry')}</Button>}>
          {services.error}
        </EmptyState>
      ) : mine.length === 0 ? (
        <EmptyState icon={ListPlus} title={t('services.empty.title')} action={addButton}>
          {t('services.empty.body')}
        </EmptyState>
      ) : (
        <>
        {missingLists > 0 && (
          <div
            role="status"
            className="mb-4 flex items-start gap-3 rounded-xl border border-diya/40 bg-diya/10 p-4 text-sm"
          >
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-sindoor" aria-hidden="true" />
            <p>{ts.plural('services.missingBanner', missingLists)}</p>
          </div>
        )}
        {missingLighter > 0 && (
          <div
            role="status"
            className="mb-4 flex items-start gap-3 rounded-xl border border-diya/40 bg-diya/10 p-4 text-sm"
          >
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-sindoor" aria-hidden="true" />
            <p>{ts.plural('services.lighterMissingBanner', missingLighter)}</p>
          </div>
        )}
        <ul className="grid gap-3">
          {mine.map((raw) => {
            const s = withDef(raw);
            const def = s.service_definition;
            const name = def ? pick(def, 'name', locale) : t('puja.fallback');
            const both = offersLighter(s);
            const lighterKit = samagriKitPriceFor(s, 'lighter');
            return (
              <li
                key={s.id}
                className={cn(
                  'flex flex-col gap-4 rounded-xl border bg-card p-4 transition-opacity sm:flex-row sm:items-center sm:p-5',
                  !s.is_active && 'bg-muted/40',
                )}
              >
                <div className={cn('flex min-w-0 flex-1 items-start gap-4', !s.is_active && 'opacity-70')}>
                  <PujaIcon category={def?.category} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="min-w-0 text-xl leading-tight break-words">{name}</h2>
                      {def?.supports_online && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <Video className="size-3" aria-hidden="true" /> {t('services.online')}
                        </span>
                      )}
                      {!s.is_active && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border">
                          {t('services.paused')}
                        </span>
                      )}
                    </div>
                    <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <dt className="sr-only">{t('services.standard')}</dt>
                        <IndianRupee className="size-4 text-muted-foreground" aria-hidden="true" />
                        <dd>
                          <span className="font-heading text-lg text-heading">{f.inr(s.standard_price)}</span>
                          <span className="text-muted-foreground"> · {f.duration(Number(s.standard_duration_minutes))}</span>
                        </dd>
                      </div>
                      {s.offers_lighter_mode && s.lighter_mode_price != null && (
                        <div className="flex items-center gap-2">
                          <dt className="sr-only">{t('services.lighter')}</dt>
                          <Feather className="size-4 text-muted-foreground" aria-hidden="true" />
                          <dd className="text-muted-foreground">
                            {t('services.lighterLine', {
                              price: f.inr(s.lighter_mode_price),
                              duration: f.duration(Number(s.lighter_mode_duration_minutes)),
                            })}
                          </dd>
                        </div>
                      )}
                      {s.offers_samagri_kit && s.samagri_kit_price != null && (
                        <div className="flex items-center gap-2">
                          <dt className="sr-only">{ts('svc.kit.title')}</dt>
                          <Package className="size-4 text-muted-foreground" aria-hidden="true" />
                          <dd className="text-muted-foreground">
                            {ts('services.kitLine', { price: f.inr(s.samagri_kit_price) })}
                          </dd>
                        </div>
                      )}
                      {s.offers_samagri_kit && both && s.lighter_samagri_kit_price != null && (
                        <div className="flex items-center gap-2">
                          <dt className="sr-only">{ts('svc.kit.lighterPrice')}</dt>
                          <Package className="size-4 text-muted-foreground" aria-hidden="true" />
                          <dd className="text-muted-foreground">
                            {ts('services.lighterKitLine', { price: f.inr(lighterKit) })}
                          </dd>
                        </div>
                      )}
                    </dl>
                    <ListStatus
                      list={s.samagri_list}
                      mode={both ? 'full' : 'only'}
                      pujaName={name}
                      onUpload={() => setEditing(s)}
                    />
                    {both && (
                      <ListStatus
                        list={s.lighter_samagri_list}
                        mode="lighter"
                        pujaName={name}
                        onUpload={() => setEditing(s)}
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t pt-3 sm:border-0 sm:pt-0">
                  <label className="flex min-h-11 items-center gap-3 pr-2 text-sm">
                    <Switch
                      checked={s.is_active}
                      disabled={toggling === s.id}
                      onCheckedChange={(c) => toggleActive(raw, c)}
                      aria-label={t('services.toggleAria', { puja: name })}
                    />
                    <span aria-hidden="true">{s.is_active ? t('services.bookable') : t('services.paused')}</span>
                  </label>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-lg" onClick={() => setEditing(s)} aria-label={t('services.editAria', { puja: name })}>
                      <Pencil aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      onClick={() => setDeleting(s)}
                      aria-label={t('services.removeAria', { puja: name })}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        </>
      )}

      {mine.length > 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          {feeBefore}
          <Link href="/dashboard" className="text-primary underline-offset-4 hover:underline">
            {t('services.feeLink')}
          </Link>
          {feeAfter}
        </p>
      )}

      <ServiceDialog
        open={adding}
        onOpenChange={setAdding}
        token={token}
        available={available}
        onSaved={upsert}
      />
      <ServiceDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        token={token}
        service={editing ?? undefined}
        onSaved={upsert}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        destructive
        title={t('services.remove.title', {
          puja: deleting?.service_definition ? pick(deleting.service_definition, 'name', locale) : t('puja.this'),
        })}
        description={t('services.remove.desc')}
        confirmLabel={t('services.remove.confirm')}
        cancelLabel={t('services.remove.keep')}
        onConfirm={remove}
      />
    </PageShell>
  );
}

/**
 * One samagri list of a puja on the pandit's services page: its type and a
 * viewer link, or a "missing" warning with an upload button. `mode` names the
 * list when the puja has both the full and the shorter version.
 */
function ListStatus({
  list,
  mode,
  pujaName,
  onUpload,
}: {
  list: SamagriList | null | undefined;
  mode: 'only' | 'full' | 'lighter';
  pujaName: string;
  onUpload: () => void;
}) {
  const ts = useT('samagri');
  if (!list) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-diya/15 px-2.5 py-1 text-sm font-medium text-sindoor ring-1 ring-diya/40">
          <TriangleAlert className="size-4" aria-hidden="true" />{' '}
          {mode === 'lighter' ? ts('services.lighterListMissing') : ts('services.listMissing')}
        </span>
        <Button variant="outline" size="sm" className="min-h-11" onClick={onUpload}>
          <Upload aria-hidden="true" /> {ts('services.listUpload')}
        </Button>
      </div>
    );
  }
  const pdf = list.type === 'pdf';
  const text =
    mode === 'lighter'
      ? pdf
        ? ts.plural('services.lighterListPdf', list.pages ?? 1)
        : ts('services.lighterListImage')
      : mode === 'full'
        ? pdf
          ? ts.plural('services.fullListPdf', list.pages ?? 1)
          : ts('services.fullListImage')
        : pdf
          ? ts.plural('services.listPdf', list.pages ?? 1)
          : ts('services.listImage');
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 text-sm">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        {pdf ? <FileText className="size-4" aria-hidden="true" /> : <ImageIcon className="size-4" aria-hidden="true" />}
        {text}
      </span>
      <SamagriListButton
        list={list}
        pujaName={pujaName}
        modeLabel={mode === 'lighter' ? ts('mode.lighterList') : mode === 'full' ? ts('mode.fullList') : undefined}
        label={ts('svc.list.view')}
      />
    </div>
  );
}
