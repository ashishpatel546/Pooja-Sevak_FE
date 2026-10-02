'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarHeart, HeartHandshake, MapPin, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale, useT } from '@/i18n';
import { api } from '@/lib/api';
import { DEFAULT_PLACE, fromPanchangPlace, IST_ZONE, toPanchangPlace } from '@/lib/place';
import { useRequireAuth } from '@/lib/use-require-auth';
import type {
  ObservanceKey,
  Remembrance,
  ReminderPreferences,
  ServiceDefinition,
  UpcomingReminder,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/common/empty-state';
import { DiyaLoader } from '@/components/common/loading';
import { PageShell } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApiQuery } from '@/components/customer/use-api';
import { OBSERVANCE_KEYS, pujaNamesFrom } from '@/components/ritual/observance';
import { RemembranceCard } from '@/components/ritual/remembrance-card';
import { RemembranceDialog } from '@/components/ritual/remembrance-dialog';
import { ReminderPreferencesForm } from '@/components/ritual/reminder-preferences';
import { UpcomingTimeline } from '@/components/ritual/upcoming-timeline';
import { useErrorText } from '@/components/ritual/use-error-text';
import { PlaceSync } from '@/components/ritual/place-control';
import { usePlace, usePlaceName } from '@/components/ritual/use-place';

const TABS = ['upcoming', 'loved-ones', 'preferences'] as const;
type Tab = (typeof TABS)[number];
const isTab = (v: unknown): v is Tab => typeof v === 'string' && (TABS as readonly string[]).includes(v);
const isObservanceKey = (v: unknown): v is ObservanceKey =>
  typeof v === 'string' && (OBSERVANCE_KEYS as string[]).includes(v);

function LoadError({ title, onRetry }: { title: string; onRetry: () => void }) {
  const t = useT('reminders');
  const tc = useT('common');
  return (
    <EmptyState
      icon={RefreshCw}
      title={title}
      action={
        <Button size="lg" onClick={onRetry}>
          {tc('action.retry')}
        </Button>
      }
    >
      {t('error.loadHint')}
    </EmptyState>
  );
}

function ListSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('grid gap-3', className)} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={cn('rounded-xl', i === 0 ? 'h-44' : 'h-20')} />
      ))}
    </div>
  );
}

function Smaran() {
  const t = useT('reminders');
  const { locale } = useLocale();
  const errorText = useErrorText();
  const router = useRouter();
  const params = useSearchParams();
  const { ready, user, token } = useRequireAuth();

  const [tab, setTab] = useState<Tab>(() => (isTab(params.get('tab')) ? (params.get('tab') as Tab) : 'upcoming'));
  const [remindKey] = useState<ObservanceKey | null>(() => {
    const k = params.get('remind');
    return isObservanceKey(k) ? k : null;
  });

  const upcoming = useApiQuery<UpcomingReminder[]>(ready ? '/reminders/upcoming' : null, {
    token,
    query: { days: 120 },
  });
  const loved = useApiQuery<Remembrance[]>(ready ? '/reminders/remembrances' : null, { token });
  const prefs = useApiQuery<ReminderPreferences>(ready ? '/reminders/preferences' : null, { token });
  const catalog = useApiQuery<ServiceDefinition[]>('/service-definitions');
  const pujaNames = useMemo(() => pujaNamesFrom(catalog.data), [catalog.data]);

  // Reminder location: the server uses Lucknow/IST until one is saved. The
  // first time we see none, save the visitor's own place so the 6 AM reminder
  // and the dates below follow their clock.
  const place = usePlace();
  const placeLabel = usePlaceName();
  const autoPlaceStarted = useRef(false);
  const [autoPlaceTried, setAutoPlaceTried] = useState(false);
  const prefsData = prefs.data;
  const { setData: setPrefsData } = prefs;
  const { reload: reloadUpcoming } = upcoming;
  useEffect(() => {
    if (!prefsData || prefsData.location !== null || autoPlaceStarted.current || !token) return;
    autoPlaceStarted.current = true;
    api<ReminderPreferences>('/reminders/preferences', {
      method: 'PUT',
      token,
      body: { ...prefsData, location: toPanchangPlace(place) },
    })
      .then((saved) => {
        setPrefsData(saved);
        reloadUpcoming();
      })
      .catch(() => {
        /* keep Lucknow; the visitor can still choose a place in Preferences */
      })
      .finally(() => setAutoPlaceTried(true));
  }, [prefsData, place, token, setPrefsData, reloadUpcoming]);
  const awaitingPlace = prefsData?.location === null && !autoPlaceTried;
  const reminderPlace = (prefsData?.location && fromPanchangPlace(prefsData.location)) || DEFAULT_PLACE;
  const reminderTz = prefsData?.location?.tz ?? IST_ZONE;

  const [editing, setEditing] = useState<Remembrance | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Remembrance | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const changeTab = (next: Tab) => {
    setTab(next);
    router.replace(`/reminders?tab=${next}`, { scroll: false });
  };

  if (!ready || !user) return <DiyaLoader label={t('loading')} />;

  const lovedList = [...(loved.data ?? [])].sort((a, b) => a.next_date.localeCompare(b.next_date));

  const onSaved = (r: Remembrance) => {
    const rest = (loved.data ?? []).filter((x) => x.id !== r.id);
    loved.setData([...rest, r]);
    upcoming.reload();
  };

  const confirmDelete = async () => {
    const target = deleting;
    if (!target || !loved.data) return;
    const before = loved.data;
    setDeleting(null);
    setRemovingId(target.id);
    // Optimistic: the card fades out at once and comes back if the server refuses.
    try {
      await api(`/reminders/remembrances/${target.id}`, { method: 'DELETE', token });
      loved.setData(before.filter((x) => x.id !== target.id));
      toast.success(t('toast.removed', { name: target.person_name }));
      upcoming.reload();
    } catch (e) {
      loved.setData(before);
      toast.error(errorText(e, t('toast.removeFailed')));
    } finally {
      setRemovingId(null);
    }
  };

  const addButton = (
    <Button size="lg" onClick={() => setEditing('new')}>
      <Plus aria-hidden="true" />
      {t('loved.add')}
    </Button>
  );

  return (
    <PageShell>
      <PlaceSync requested={place} refresh={false} />
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className={cn('text-4xl sm:text-5xl', locale === 'hi' ? 'leading-[1.3]' : 'leading-tight')}>
            {t('title')}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="shrink-0">{addButton}</div>
      </header>

      <Tabs value={tab} onValueChange={(v) => isTab(v) && changeTab(v)} className="gap-8">
        <TabsList className="grid h-auto! w-full grid-cols-3 sm:inline-grid sm:w-auto">
          <TabsTrigger value="upcoming" className="min-h-11 px-3 sm:px-5">
            {t('tab.upcoming')}
          </TabsTrigger>
          <TabsTrigger value="loved-ones" className="min-h-11 px-3 sm:px-5">
            {t('tab.loved')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="min-h-11 px-3 sm:px-5">
            {t('tab.preferences')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="min-w-0 text-base">
          {upcoming.loading && !upcoming.data ? (
            <ListSkeleton rows={4} />
          ) : upcoming.error ? (
            <LoadError title={t('error.upcoming')} onRetry={upcoming.reload} />
          ) : !upcoming.data?.length ? (
            <EmptyState
              icon={CalendarHeart}
              title={t('upcoming.emptyTitle')}
              action={
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button size="lg" onClick={() => setEditing('new')}>
                    {t('loved.add')}
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => changeTab('preferences')}>
                    {t('upcoming.chooseDays')}
                  </Button>
                </div>
              }
            >
              {t('upcoming.emptyText')}
            </EmptyState>
          ) : (
            <UpcomingTimeline items={upcoming.data} pujaNames={pujaNames} tz={reminderTz} />
          )}
          {prefsData && (
            <p className="mt-6 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{t('upcoming.placeLine', { place: placeLabel(reminderPlace) })}</span>
              <button
                type="button"
                onClick={() => changeTab('preferences')}
                className="inline-flex min-h-11 items-center rounded px-1 font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {t('upcoming.placeChange')}
              </button>
            </p>
          )}
        </TabsContent>

        <TabsContent value="loved-ones" className="min-w-0 text-base">
          <p className="mb-6 max-w-2xl font-heading text-xl leading-relaxed text-heading">{t('loved.intro')}</p>
          {loved.loading && !loved.data ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : loved.error ? (
            <LoadError title={t('error.loved')} onRetry={loved.reload} />
          ) : lovedList.length === 0 ? (
            <EmptyState icon={HeartHandshake} title={t('loved.emptyTitle')} action={addButton}>
              {t('loved.emptyText')}
            </EmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lovedList.map((r) => (
                <li key={r.id} className="min-w-0">
                  <RemembranceCard
                    r={r}
                    pujaNames={pujaNames}
                    pending={removingId === r.id}
                    onEdit={() => setEditing(r)}
                    onDelete={() => setDeleting(r)}
                    tz={reminderTz}
                  />
                </li>
              ))}
              <li className="min-w-0">
                <button
                  type="button"
                  onClick={() => setEditing('new')}
                  className="flex h-full min-h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-5 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/30 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <Plus className="size-6" aria-hidden="true" />
                  <span className="font-medium">{t('loved.addAnother')}</span>
                </button>
              </li>
            </ul>
          )}
          <p className="mt-6 max-w-2xl text-sm text-muted-foreground">{t('loved.footnote')}</p>
        </TabsContent>

        <TabsContent value="preferences" className="min-w-0 text-base">
          {(prefs.loading && !prefs.data) || awaitingPlace ? (
            <ListSkeleton rows={3} />
          ) : prefs.error || !prefs.data ? (
            <LoadError title={t('error.prefs')} onRetry={prefs.reload} />
          ) : (
            <ReminderPreferencesForm
              initial={prefs.data}
              user={user}
              token={token}
              remindKey={remindKey}
              onSaved={(p) => {
                prefs.setData(p);
                upcoming.reload();
              }}
              onAutoEnabled={() => router.replace('/reminders?tab=preferences', { scroll: false })}
            />
          )}
        </TabsContent>
      </Tabs>

      <p className="mt-12 border-t pt-6 text-sm text-muted-foreground">
        {t('panchangLinkLead')}{' '}
        <Link href="/panchang" className="font-medium text-primary underline-offset-4 hover:underline">
          {t('panchangLink')}
        </Link>
      </p>

      <RemembranceDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        initial={editing === 'new' ? null : editing}
        onSaved={onSaved}
      />

      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl leading-snug">
              {t('delete.title', { name: deleting?.person_name ?? '' })}
            </DialogTitle>
            <DialogDescription className="text-base">{t('delete.text')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setDeleting(null)}>
              {t('delete.keep')}
            </Button>
            <Button variant="destructive" size="lg" onClick={confirmDelete}>
              {t('delete.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Loading() {
  const t = useT('reminders');
  return <DiyaLoader label={t('loading')} />;
}

export default function RemindersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Smaran />
    </Suspense>
  );
}
