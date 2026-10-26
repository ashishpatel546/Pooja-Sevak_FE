'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Download, HandHeart, ScrollText } from 'lucide-react';
import { useT } from '@/i18n';
import type { Locale } from '@/i18n/config';
import { api } from '@/lib/api';
import {
  displayName,
  isMilan,
  pickName,
  setAttachedKundali,
  type KundaliQuota,
  type KundaliReportView,
} from '@/lib/kundali';
import { normalizeBusinessProfile } from '@/lib/site-info';
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from '@/lib/support';
import { useRequireAuth } from '@/lib/use-require-auth';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/common/empty-state';
import { DiyaLoader } from '@/components/common/loading';
import { PageShell } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { useApiQuery } from '@/components/customer/use-api';
import type { ChartStyle } from '@/components/kundali/kundali-chart';
import { EditNamesButton } from '@/components/kundali/hindi-names';
import { KundaliReportBody } from '@/components/kundali/kundali-report';
import { MilanReportBody } from '@/components/kundali/milan-report';
import { KundaliCover, MilanCover, PrintFrame, PrintPages, pageRule } from '@/components/kundali/print-chrome';
import { fmtCivilDate, fmtDate, useReportT } from '@/components/kundali/report-kit';

const STYLE_KEY = 'ps_chart_style';

function readStyle(): ChartStyle {
  try {
    return localStorage.getItem(STYLE_KEY) === 'south' ? 'south' : 'north';
  } catch {
    return 'north';
  }
}

/** Two-option toggle shown as a segmented control. */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string, string?][];
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-xl border bg-card p-1">
      {options.map(([v, text, lang]) => (
        <button
          key={v}
          type="button"
          lang={lang}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn(
            'min-h-10 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
            value === v ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export default function KundaliReportPage() {
  const { id } = useParams<{ id: string }>();
  const ts = useT('kundali'); // site language, for the page chrome before a report loads
  const { ready, token } = useRequireAuth();
  // ?booking= opens a kundali a family attached to a booking (read-only, for its pandit).
  const booking = useSearchParams().get('booking');
  const router = useRouter();
  const report = useApiQuery<KundaliReportView>(
    !ready ? null : booking ? `/kundali/bookings/${booking}/report` : `/kundali/reports/${id}`,
    { token },
  );
  const exhausted = report.status === 403;
  const quota = useApiQuery<KundaliQuota>(ready && exhausted ? '/kundali/quota' : null, { token });
  // Contact details printed on every PDF page; the owner edits them in Admin → Settings.
  const profile = useApiQuery<unknown>(ready ? '/public/business-profile' : null);

  const [lang, setLang] = useState<Locale | null>(null);
  const [chartStyle, setChartStyle] = useState<ChartStyle>('north');
  // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only
  useEffect(() => setChartStyle(readStyle()), []);

  // The PDF should hold every dasha period, so open collapsed sections while printing
  // (except pratyantar lists outside the running mahadasha, which would run to many pages).
  useEffect(() => {
    let opened: HTMLDetailsElement[] = [];
    const before = () => {
      opened = [...document.querySelectorAll<HTMLDetailsElement>('article details:not([open]):not([data-print-skip])')];
      opened.forEach((d) => (d.open = true));
    };
    const after = () => {
      opened.forEach((d) => (d.open = false));
      opened = [];
    };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  const reportLang: Locale = lang ?? report.data?.language ?? 'hi';
  const t = useReportT(reportLang);

  // "Save as PDF" names the file after the page title: "Janam Kundali - Shasvika Patel".
  const input = report.data?.input;
  const pdfTitle = !input
    ? ''
    : 'person' in input
      ? `${t('report.title')} - ${input.person.name || t('report.ofNewborn')}`
      : `${t('report.milanTitle')} - ${input.boy.name} & ${input.girl.name}`;
  useEffect(() => {
    if (!pdfTitle) return;
    let saved = '';
    const before = () => {
      if (document.title !== pdfTitle) saved = document.title;
      document.title = pdfTitle;
    };
    const after = () => {
      if (saved) document.title = saved;
    };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, [pdfTitle]);

  const changeLang = (next: Locale) => {
    setLang(next);
    if (token && !booking) void api(`/kundali/reports/${id}/language`, { method: 'PUT', token, body: { language: next } }).catch(() => {});
  };
  const changeStyle = (next: ChartStyle) => {
    setChartStyle(next);
    try {
      localStorage.setItem(STYLE_KEY, next);
    } catch {
      /* the choice just isn't remembered */
    }
  };

  const back = (
    <Button
      variant="ghost"
      className="-ml-3 print:hidden"
      render={<Link href={booking ? '/pandit/bookings' : '/kundali?tab=mine'} />}
      nativeButton={false}
    >
      <ArrowLeft aria-hidden="true" />
      {booking ? ts('report.backBookings') : ts('report.back')}
    </Button>
  );

  if (!report.data) {
    if (exhausted) {
      return (
        <PageShell size="narrow">
          {back}
          <EmptyState
            icon={ScrollText}
            title={ts('quota.exhaustedTitle')}
            action={
              <Button render={<Link href="/kundali?tab=mine" />} nativeButton={false}>
                {ts('tab.mine')}
              </Button>
            }
          >
            {quota.data
              ? ts('quota.exhaustedKundali', { date: fmtCivilDate(quota.data.resets_on, reportLang) })
              : ts('quota.how')}
          </EmptyState>
        </PageShell>
      );
    }
    if (report.error) {
      return (
        <PageShell size="narrow">
          {back}
          <EmptyState
            icon={ScrollText}
            title={report.status === 404 ? ts('report.notFound') : ts('report.loadError')}
            action={report.status === 404 ? undefined : <Button onClick={report.reload}>{ts('report.retry')}</Button>}
          />
        </PageShell>
      );
    }
    return (
      <PageShell size="narrow">
        <DiyaLoader label={ts('report.loading')} />
      </PageShell>
    );
  }

  const r = report.data;
  const milan = isMilan(r.result) && 'boy' in r.input ? { m: r.result, boy: r.input.boy, girl: r.input.girl } : null;
  const person = 'person' in r.input ? r.input.person : null;

  const biz = normalizeBusinessProfile(profile.data);
  const contact = { phone: biz?.support_phone || SUPPORT_PHONE_DISPLAY, email: biz?.support_email || SUPPORT_EMAIL };
  const prepared = t('report.preparedOn', { date: fmtDate(r.delivered_at ?? r.created_at, reportLang, 'Asia/Kolkata') });
  const moon = isMilan(r.result) ? null : r.result.grahas.find((g) => g.key === 'mo')!;

  return (
    <PageShell className="print:max-w-none print:p-0">
      {/* Edge-to-edge A4 so the border and colours print as designed; the frame sets its own margins. */}
      <style>
        {pageRule(t('pdf.page'))}
      </style>
      <PrintFrame contact={contact} t={t} />
      <div className="mb-6 flex flex-col gap-4 print:hidden">
        {back}
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label={t('report.language')}
            value={reportLang}
            options={[
              ['hi', 'हिन्दी', 'hi'],
              ['en', 'English', 'en'],
            ]}
            onChange={changeLang}
          />
          <Segmented
            label={t('charts.style')}
            value={chartStyle}
            options={[
              ['north', t('charts.north')],
              ['south', t('charts.south')],
            ]}
            onChange={changeStyle}
          />
          {token && !booking && (
            <EditNamesButton reportId={r.id} input={r.input} token={token} onSaved={report.reload} />
          )}
          {!booking && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setAttachedKundali(r.id);
                router.push('/browse');
              }}
              aria-describedby="ask-hint"
            >
              <HandHeart aria-hidden="true" />
              {t('ask.button')}
            </Button>
          )}
          <Button size="lg" className="sm:ml-auto" onClick={() => window.print()} aria-describedby="print-hint">
            <Download aria-hidden="true" />
            {t('report.print')}
          </Button>
        </div>
        <p id="print-hint" className="text-sm text-muted-foreground sm:text-right">
          {t('report.printHint')}
        </p>
        {!booking && (
          <p id="ask-hint" className="sr-only">
            {t('ask.hint')}
          </p>
        )}
      </div>

      <PrintPages>
        <article lang={reportLang} className="grid grid-cols-1 gap-6 print:block print:space-y-6">
          {milan ? (
            <MilanCover
              boy={milan.boy}
              girl={milan.girl}
              boyName={displayName(milan.boy, reportLang)}
              girlName={displayName(milan.girl, reportLang)}
              total={milan.m.total}
              verdict={t(`milan.verdict.${milan.m.verdict}`)}
              prepared={prepared}
              lang={reportLang}
              t={t}
            />
          ) : (
            !isMilan(r.result) && (
              <KundaliCover
                person={person!}
                name={person!.name ? displayName(person!, reportLang) : t('report.ofNewborn')}
                lagna={r.result.lagna.sign}
                moon={moon!.sign}
                lagnaName={pickName(r.result.lagna.sign_name, reportLang)}
                rashiName={pickName(moon!.sign_name, reportLang)}
                nakshatra={pickName(r.result.panchang.nakshatra_name, reportLang)}
                prepared={prepared}
                lang={reportLang}
                t={t}
              />
            )
          )}
          <header className="sandhya stars relative overflow-hidden rounded-2xl px-5 py-8 text-center sm:px-8 print:hidden">
            <p lang="sa" className="font-heading text-lg text-diya">
              {ts('hero.invocation')}
            </p>
            <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">{milan ? t('report.milanTitle') : t('report.title')}</h1>
            <p className="mt-2 font-heading text-2xl text-[#fbe3b6]">
              {milan
                ? t('report.milanOf', { boy: displayName(milan.boy, reportLang), girl: displayName(milan.girl, reportLang) })
                : person!.name
                  ? t('report.of', { name: displayName(person!, reportLang) })
                  : t('report.ofNewborn')}
            </p>
            <div aria-hidden="true" className="toran mx-auto mt-4 max-w-xs" />
            <p className="mt-3 text-sm">{prepared}</p>
          </header>

          {milan ? (
            <MilanReportBody m={milan.m} boy={milan.boy} girl={milan.girl} lang={reportLang} t={t} chartStyle={chartStyle} />
          ) : (
            !isMilan(r.result) && (
              <KundaliReportBody
                k={r.result}
                person={person!}
                lang={reportLang}
                t={t}
                chartStyle={chartStyle}
                gochar={r.gochar}
              />
            )
          )}

          <footer className="grid gap-2 rounded-2xl border bg-accent/20 p-5 text-sm text-muted-foreground print:break-inside-avoid">
            <p>{t('footnote.method')}</p>
            <p className="font-medium text-foreground">{t('footnote.guidance')}</p>
          </footer>
        </article>
      </PrintPages>
    </PageShell>
  );
}
