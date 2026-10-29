'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ScrollText, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale, useT } from '@/i18n';
import type { Locale } from '@/i18n/config';
import { api, ApiError } from '@/lib/api';
import { track } from '@/lib/analytics';
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
import { KundaliPreviewCard, MilanPreviewCard, previewBody, type KundaliPreview, type MilanPreview } from '@/components/kundali/preview-cards';
import { fmtCivilDate, fmtWallTime } from '@/components/kundali/report-kit';

const TABS = ['kundali', 'milan', 'mine'] as const;
type Tab = (typeof TABS)[number];
const isTab = (v: unknown): v is Tab => typeof v === 'string' && (TABS as readonly string[]).includes(v);

/** Form kept across the sign-in round trip, so nothing typed is lost. */
const DRAFT_KEY = 'ps_kundali_draft';
type Draft = {
  tab: 'kundali' | 'milan';
  person: BirthDraft;
  boy: BirthDraft;
  girl: BirthDraft;
  language: Locale;
  /** Open the full report as soon as the visitor is signed in (set by the preview's CTA). */
  auto?: boolean;
};

/** /kundali hosts the janam kundali and "my kundalis"; /kundali-milan the milan form. */
export type HubPage = 'kundali' | 'milan';
const PAGE_PATH: Record<HubPage, string> = { kundali: '/kundali', milan: '/kundali-milan' };

type Preview = { kind: 'kundali'; data: KundaliPreview } | { kind: 'milan'; data: MilanPreview };

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

/**
 * The kundali / milan forms. Signed out, a submit shows a login-free preview
 * (nothing saved, no quota); its CTA keeps the form and opens the full report
 * right after sign-in. Signed in, a submit creates the full report.
 */
export function KundaliHub({ page }: { page: HubPage }) {
  const t = useT('kundali');
  const tt = useT('tools');
  const { locale } = useLocale();
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [tab, setTab] = useState<Tab>(() => (page === 'milan' ? 'milan' : params.get('tab') === 'mine' ? 'mine' : 'kundali'));
  const [person, setPerson] = useState<BirthDraft>(EMPTY_BIRTH);
  const [boy, setBoy] = useState<BirthDraft>({ ...EMPTY_BIRTH, gender: 'male' });
  const [girl, setGirl] = useState<BirthDraft>({ ...EMPTY_BIRTH, gender: 'female' });
  const [language, setLanguage] = useState<Locale>(locale);
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [verifyNeeded, setVerifyNeeded] = useState<string | null>(null);
  const [autoKind, setAutoKind] = useState<'kundali' | 'milan' | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const maxDate = todayKey();

  useEffect(() => {
    track('tool_view', { tool: page });
  }, [page]);

  // Restore a form saved before the sign-in round trip.
  useEffect(() => {
    const d = readDraft();
    if (!d) return;
    writeDraft(null);
    /* eslint-disable react-hooks/set-state-in-effect -- one-time restore from sessionStorage */
    if (d.tab === 'kundali' || page === 'milan') setTab(d.tab);
    setPerson(d.person);
    setBoy(d.boy);
    setGirl(d.girl);
    setLanguage(d.language);
    if (d.auto) setAutoKind(d.tab);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [page]);

  const quota = useApiQuery<KundaliQuota>(user && token ? '/kundali/quota' : null, { token });

  const changeTab = (next: Tab) => {
    setShowErrors(false);
    if (page === 'kundali' && next === 'milan') return router.push(PAGE_PATH.milan);
    if (page === 'milan' && next !== 'milan') return router.push(next === 'mine' ? '/kundali?tab=mine' : '/kundali');
    setTab(next);
    router.replace(next === 'mine' ? '/kundali?tab=mine' : '/kundali', { scroll: false });
  };

  const showPreview = async (kind: 'kundali' | 'milan') => {
    setBusy(true);
    setPreviewError(null);
    try {
      const body = kind === 'kundali' ? { person: previewBody(person) } : { boy: previewBody(boy), girl: previewBody(girl) };
      const data = await api<KundaliPreview | MilanPreview>(kind === 'kundali' ? '/kundali/preview' : '/kundali/milan/preview', {
        method: 'POST',
        body,
      });
      setPreview(kind === 'kundali' ? { kind, data: data as KundaliPreview } : { kind, data: data as MilanPreview });
      track('preview_shown', { tool: kind });
      window.setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (e) {
      setPreview(null);
      setPreviewError(e instanceof ApiError && e.code === 'rate_limited' ? tt('preview.rateLimited') : tt('preview.error'));
    } finally {
      setBusy(false);
    }
  };

  const submit = useCallback(
    async (kind: 'kundali' | 'milan') => {
      const ready = kind === 'kundali' ? isComplete(person) : isComplete(boy) && isComplete(girl);
      if (!ready) {
        setShowErrors(true);
        return;
      }
      track('tool_submit', { tool: kind });
      if (!user || !token) return showPreview(kind);
      setBusy(true);
      setVerifyNeeded(null);
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
        // Full reports may need a verified email or mobile: say so, with a way to do it.
        else if (e instanceof ApiError && e.status === 403) setVerifyNeeded(errorMessage(e, tt('preview.verifyNeeded')));
        else toast.error(errorMessage(e, t('form.createError')));
        setBusy(false);
      }
    },
    // showPreview only reads the same form state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [person, boy, girl, language, user, token, router, quota.reload, t, tt],
  );

  // Back from sign-in via the preview's CTA: open the full report straight away.
  useEffect(() => {
    if (!autoKind || loading || !user || !token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- runs once, then clears itself
    setAutoKind(null);
    void submit(autoKind);
  }, [autoKind, loading, user, token, submit]);

  const signInForFull = (kind: 'kundali' | 'milan') => {
    writeDraft({ tab: kind, person, boy, girl, language, auto: true });
    track('login_from_tool', { tool: kind });
    router.push(`/login?next=${encodeURIComponent(PAGE_PATH[kind === 'kundali' ? 'kundali' : 'milan'])}`);
  };

  const signedOut = !loading && !user;

  const submitBar = (kind: 'kundali' | 'milan') => (
    <div className="grid gap-4 border-t pt-5">
      <LanguageChoice value={language} onChange={setLanguage} />
      {user && <QuotaNote kind={kind} quota={quota.data} />}
      {signedOut && (
        <p className="rounded-xl bg-accent/40 p-4 text-sm">
          {kind === 'kundali' ? tt('preview.signedOutNote') : tt('preview.signedOutNoteMilan')}
        </p>
      )}
      {verifyNeeded && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-diya/50 bg-chandan/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex gap-2">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            {verifyNeeded}
          </p>
          <Button variant="outline" render={<Link href="/account#verify-mobile" />} nativeButton={false}>
            {tt('preview.verifyAction')}
          </Button>
        </div>
      )}
      <Button type="submit" size="lg" className="w-full sm:w-auto sm:justify-self-start" disabled={busy}>
        {busy
          ? signedOut
            ? tt('preview.loading')
            : t('form.preparing')
          : signedOut
            ? kind === 'kundali'
              ? tt('preview.submit')
              : tt('preview.submitMilan')
            : kind === 'kundali'
              ? t('form.submitKundali')
              : t('form.submitMilan')}
      </Button>
      {previewError && (
        <p role="alert" className="text-sm text-destructive">
          {previewError}
        </p>
      )}
    </div>
  );

  const previewBlock = (kind: 'kundali' | 'milan') =>
    preview?.kind === kind && (
      <div ref={previewRef} className="scroll-mt-24">
        {preview.kind === 'kundali' ? (
          <KundaliPreviewCard data={preview.data} onFull={() => signInForFull('kundali')} />
        ) : (
          <MilanPreviewCard data={preview.data} onFull={() => signInForFull('milan')} />
        )}
      </div>
    );

  return (
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

      {page === 'kundali' && (
        <TabsContent value="kundali" className="grid min-w-0 gap-6">
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
          {previewBlock('kundali')}
        </TabsContent>
      )}

      {page === 'milan' && (
        <TabsContent value="milan" className="grid min-w-0 gap-6">
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
          {previewBlock('milan')}
        </TabsContent>
      )}

      {page === 'kundali' && user && token && (
        <TabsContent value="mine" className="min-w-0">
          <h2 className="sr-only">{t('list.title')}</h2>
          <SavedList token={token} />
        </TabsContent>
      )}
    </Tabs>
  );
}
