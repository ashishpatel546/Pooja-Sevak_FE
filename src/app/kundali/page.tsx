'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BadgeCheck, LockKeyhole, Orbit, ScrollText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale, useT } from '@/i18n';
import type { Locale } from '@/i18n/config';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { displayName,
  QUOTA_EXHAUSTED,
  type KindQuota,
  type KundaliKind,
  type KundaliQuota,
  type KundaliReportSummary,
} from '@/lib/kundali';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/common/empty-state';
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
import { errorMessage, useApiQuery } from '@/components/customer/use-api';
import { BirthFields, EMPTY_BIRTH, isComplete, personName, toPayload, type BirthDraft } from '@/components/kundali/birth-fields';
import { fmtCivilDate, fmtWallTime } from '@/components/kundali/report-kit';

const TABS = ['kundali', 'milan', 'mine'] as const;
type Tab = (typeof TABS)[number];
const isTab = (v: unknown): v is Tab => typeof v === 'string' && (TABS as readonly string[]).includes(v);

/** Form kept across the sign-in round trip, so nothing typed is lost. */
const DRAFT_KEY = 'ps_kundali_draft';
type Draft = { tab: 'kundali' | 'milan'; person: BirthDraft; boy: BirthDraft; girl: BirthDraft; language: Locale };

function readDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}
function writeDraft(d: Draft | null) {
  try {
    if (d) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* private mode: the form simply starts empty after sign-in */
  }
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function Hero() {
  const t = useT('kundali');
  const trust = [
    { icon: Orbit, title: t('trust.precise'), text: t('trust.preciseText') },
    { icon: BadgeCheck, title: t('trust.lahiri'), text: t('trust.lahiriText') },
    { icon: LockKeyhole, title: t('trust.private'), text: t('trust.privateText') },
  ];
  return (
    <section className="sandhya stars relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16">
        <p lang="sa" className="font-heading text-lg text-diya">
          {t('hero.invocation')}
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl leading-tight text-balance sm:text-5xl">{t('hero.title')}</h1>
        <p className="mt-4 max-w-2xl text-lg">{t('hero.lead')}</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {trust.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Icon className="size-6 text-diya" aria-hidden="true" />
              <p className="mt-2 font-medium text-[#fbe3b6]">{title}</p>
              <p className="mt-1 text-sm">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function QuotaNote({ kind, quota }: { kind: KundaliKind; quota: KundaliQuota | undefined }) {
  const t = useT('kundali');
  const { locale } = useLocale();
  if (!quota) return null;
  const q: KindQuota = quota[kind];
  if (quota.unlimited) return <p className="text-sm text-muted-foreground">{t('quota.unlimited')}</p>;
  if (q.remaining === 0) {
    return (
      <div role="status" className="rounded-xl border border-diya/50 bg-chandan/60 p-4">
        <p className="font-medium">{t('quota.exhaustedTitle')}</p>
        <p className="mt-1 text-sm">
          {t(kind === 'kundali' ? 'quota.exhaustedKundali' : 'quota.exhaustedMilan', {
            date: fmtCivilDate(quota.resets_on, locale),
          })}
        </p>
      </div>
    );
  }
  return (
    <div className="text-sm">
      <p className="font-medium text-primary">
        {t.plural(kind === 'kundali' ? 'quota.kundaliLeft' : 'quota.milanLeft', q.remaining ?? 0)}
      </p>
      <p className="mt-1 text-muted-foreground">{t('quota.how')}</p>
    </div>
  );
}

function LanguageChoice({ value, onChange }: { value: Locale; onChange: (l: Locale) => void }) {
  const t = useT('kundali');
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{t('form.language')}</legend>
      <div className="flex gap-2">
        {(
          [
            ['hi', 'हिन्दी'],
            ['en', 'English'],
          ] as const
        ).map(([l, label]) => (
          <label
            key={l}
            className="flex min-h-11 cursor-pointer items-center rounded-lg border px-4 text-base has-checked:border-primary has-checked:bg-accent/50 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <input type="radio" name="report-language" value={l} checked={value === l} onChange={() => onChange(l)} className="sr-only" />
            <span lang={l}>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SavedList({ token }: { token: string }) {
  const t = useT('kundali');
  const tc = useT('common');
  const { locale } = useLocale();
  const list = useApiQuery<KundaliReportSummary[]>('/kundali/reports', { token });
  const [removing, setRemoving] = useState<KundaliReportSummary | null>(null);
  const [busy, setBusy] = useState(false);

  if (list.error && !list.data) {
    return (
      <EmptyState icon={ScrollText} title={t('list.loadError')} action={<Button onClick={list.reload}>{tc('action.retry')}</Button>} />
    );
  }
  if (!list.data) return <Skeleton className="h-40 rounded-xl" />;
  if (list.data.length === 0) return <EmptyState icon={ScrollText} title={t('list.empty')} />;

  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await api(`/kundali/reports/${removing.id}`, { method: 'DELETE', token });
      toast.success(t('list.removed'));
      setRemoving(null);
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ul className="grid gap-3">
        {list.data.map((r) => {
          const people = 'person' in r.input ? [r.input.person] : [r.input.boy, r.input.girl];
          return (
            <li key={r.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  {r.kind === 'kundali' ? t('list.kindKundali') : t('list.kindMilan')}
                  {!r.delivered_at && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs">{t('list.notOpened')}</span>}
                </p>
                <p className="font-heading text-xl break-words text-heading">
                  {'person' in r.input
                    ? personName(r.input.person, t('newborn.label'), locale)
                    : `${displayName(r.input.boy, locale)} & ${displayName(r.input.girl, locale)}`}
                </p>
                {people.map((p) => (
                  <p key={p.name + p.date} className="text-sm text-muted-foreground">
                    {people.length > 1 && `${p.name}: `}
                    {t('list.born', { date: fmtCivilDate(p.date, locale), time: fmtWallTime(p.time, locale), place: p.place.label })}
                  </p>
                ))}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button render={<Link href={`/kundali/${r.id}`} />} nativeButton={false}>
                  {t('list.open')}
                </Button>
                <Button variant="ghost" onClick={() => setRemoving(r)} aria-label={`${t('list.remove')}: ${r.title}`}>
                  <Trash2 aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">{t('list.remove')}</span>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <Dialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('list.removeTitle')}</DialogTitle>
            <DialogDescription>{t('list.removeText')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              {tc('action.cancel')}
            </Button>
            <Button variant="destructive" onClick={remove} disabled={busy}>
              {t('list.removeConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function KundaliHub() {
  const t = useT('kundali');
  const { locale } = useLocale();
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [tab, setTab] = useState<Tab>(() => (isTab(params.get('tab')) ? (params.get('tab') as Tab) : 'kundali'));
  const [person, setPerson] = useState<BirthDraft>(EMPTY_BIRTH);
  const [boy, setBoy] = useState<BirthDraft>({ ...EMPTY_BIRTH, gender: 'male' });
  const [girl, setGirl] = useState<BirthDraft>({ ...EMPTY_BIRTH, gender: 'female' });
  const [language, setLanguage] = useState<Locale>(locale);
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const maxDate = todayKey();

  // Restore a form saved before the sign-in round trip.
  useEffect(() => {
    const d = readDraft();
    if (!d) return;
    writeDraft(null);
    /* eslint-disable react-hooks/set-state-in-effect -- one-time restore from sessionStorage */
    setTab(d.tab);
    setPerson(d.person);
    setBoy(d.boy);
    setGirl(d.girl);
    setLanguage(d.language);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const quota = useApiQuery<KundaliQuota>(user && token ? '/kundali/quota' : null, { token });

  const changeTab = (next: Tab) => {
    setTab(next);
    setShowErrors(false);
    router.replace(`${pathname}?tab=${next}`, { scroll: false });
  };

  const submit = async (kind: 'kundali' | 'milan') => {
    const ready = kind === 'kundali' ? isComplete(person) : isComplete(boy) && isComplete(girl);
    if (!ready) {
      setShowErrors(true);
      return;
    }
    if (!user || !token) {
      writeDraft({ tab: kind, person, boy, girl, language });
      router.push(`/login?next=${encodeURIComponent(`/kundali?tab=${kind}`)}`);
      return;
    }
    setBusy(true);
    try {
      const body =
        kind === 'kundali'
          ? { person: toPayload(person), language }
          : { boy: toPayload(boy), girl: toPayload(girl), language };
      const report = await api<KundaliReportSummary>(kind === 'kundali' ? '/kundali/reports' : '/kundali/milan', {
        method: 'POST',
        token,
        body,
      });
      router.push(`/kundali/${report.id}`);
    } catch (e) {
      const code = e instanceof ApiError ? (e.payload as { code?: string } | null)?.code : undefined;
      if (code === QUOTA_EXHAUSTED) quota.reload();
      else toast.error(errorMessage(e, t('form.createError')));
      setBusy(false);
    }
  };

  const submitBar = (kind: 'kundali' | 'milan') => (
    <div className="grid gap-4 border-t pt-5">
      <LanguageChoice value={language} onChange={setLanguage} />
      {user && <QuotaNote kind={kind} quota={quota.data} />}
      {!loading && !user && (
        <div className="rounded-xl bg-accent/40 p-4">
          <p className="font-medium">{t('form.signInTitle')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('form.signInText')}</p>
        </div>
      )}
      <Button type="submit" size="lg" className="w-full sm:w-auto sm:justify-self-start" disabled={busy}>
        {busy
          ? t('form.preparing')
          : !user && !loading
            ? t('form.signIn')
            : kind === 'kundali'
              ? t('form.submitKundali')
              : t('form.submitMilan')}
      </Button>
    </div>
  );

  return (
    <>
      <Hero />
      <PageShell className="pt-8 sm:pt-10">
        <Tabs value={tab} onValueChange={(v) => isTab(v) && changeTab(v)} className="gap-8">
          <TabsList className={cn('grid h-auto! w-full sm:inline-grid sm:w-auto', user ? 'grid-cols-3' : 'grid-cols-2')}>
            <TabsTrigger value="kundali" className="min-h-11 px-3 sm:px-5">
              {t('tab.kundali')}
            </TabsTrigger>
            <TabsTrigger value="milan" className="min-h-11 px-3 sm:px-5">
              {t('tab.milan')}
            </TabsTrigger>
            {user && (
              <TabsTrigger value="mine" className="min-h-11 px-3 sm:px-5">
                {t('tab.mine')}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="kundali" className="min-w-0">
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void submit('kundali');
              }}
              className="grid max-w-3xl gap-6 rounded-2xl border bg-card p-5 sm:p-8"
            >
              <div>
                <h2 className="font-heading text-2xl text-heading">{t('form.kundaliTitle')}</h2>
                <p className="mt-1 text-muted-foreground">{t('form.kundaliIntro')}</p>
              </div>
              <BirthFields value={person} onChange={setPerson} showErrors={showErrors} maxDate={maxDate} allowNewborn />
              {submitBar('kundali')}
            </form>
          </TabsContent>

          <TabsContent value="milan" className="min-w-0">
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void submit('milan');
              }}
              className="grid gap-6 rounded-2xl border bg-card p-5 sm:p-8"
            >
              <div>
                <h2 className="font-heading text-2xl text-heading">{t('form.milanTitle')}</h2>
                <p className="mt-1 text-muted-foreground">{t('form.milanIntro')}</p>
              </div>
              <div className="grid gap-8 lg:grid-cols-2">
                <BirthFields value={boy} onChange={setBoy} legend={t('form.boy')} showErrors={showErrors} maxDate={maxDate} />
                <BirthFields value={girl} onChange={setGirl} legend={t('form.girl')} showErrors={showErrors} maxDate={maxDate} />
              </div>
              {submitBar('milan')}
            </form>
          </TabsContent>

          {user && token && (
            <TabsContent value="mine" className="min-w-0">
              <h2 className="sr-only">{t('list.title')}</h2>
              <SavedList token={token} />
            </TabsContent>
          )}
        </Tabs>
      </PageShell>
    </>
  );
}

export default function KundaliPage() {
  return (
    <Suspense>
      <KundaliHub />
    </Suspense>
  );
}

