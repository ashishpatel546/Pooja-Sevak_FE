'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Download, HandHeart, ScrollText } from 'lucide-react';
import { useT } from '@/i18n';
import type { Locale } from '@/i18n/config';
import { api } from '@/lib/api';
import { setAttachedKundali, type KundaliQuota, type KundaliReportView } from '@/lib/kundali';
import { useRequireAuth } from '@/lib/use-require-auth';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/common/empty-state';
import { DiyaLoader } from '@/components/common/loading';
import { PageShell } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { useApiQuery } from '@/components/customer/use-api';
import type { ChartStyle } from '@/components/kundali/kundali-chart';
import { EditNamesButton } from '@/components/kundali/hindi-names';
import { PdfActions } from '@/components/kundali/pdf-actions';
import { ReportDocument } from '@/components/kundali/report-document';
import { fmtCivilDate, useReportT } from '@/components/kundali/report-kit';

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

  return (
    <PageShell className="print:max-w-none print:p-0">
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
          {booking ? (
            <Button size="lg" className="sm:ml-auto" onClick={() => window.print()} aria-describedby="print-hint">
              <Download aria-hidden="true" />
              {t('report.print')}
            </Button>
          ) : (
            <PdfActions reportId={r.id} token={token} lang={reportLang} style={chartStyle} fileName={pdfTitle} t={t} />
          )}
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

      <ReportDocument r={r} lang={reportLang} t={t} chartStyle={chartStyle} />
    </PageShell>
  );
}
