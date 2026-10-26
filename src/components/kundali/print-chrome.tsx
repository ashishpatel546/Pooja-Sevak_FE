import type { ReactNode } from 'react';
import { Globe, Mail, Phone } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { BirthDetails } from '@/lib/kundali';
import { Diya } from '@/components/brand/diya';
import { RASHI_NAMES, fmtCivilDate, fmtWallTime, type ReportT } from './report-kit';

/**
 * The printed (PDF) look of a report: a janam-patri style page border, a contact band at the
 * foot of every page and a cover page. None of it shows on screen.
 */

export const WEBSITE = 'www.pujasevak.in';

export type Contact = { phone: string; email: string };

/** A small diamond, the shape at the heart of the North Indian chart, marking each corner. */
function Corner({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={`absolute size-[6mm] ${className}`}>
      <rect
        x="4"
        y="4"
        width="12"
        height="12"
        transform="rotate(45 10 10)"
        fill="#fffaf3"
        stroke="#c99a3a"
        strokeWidth="1.4"
      />
      <circle cx="10" cy="10" r="2.6" fill="#a61b1b" />
    </svg>
  );
}

/**
 * Drawn once but repeated on every printed page (fixed elements repeat in print). The page
 * content keeps clear of it through the spacers in `PrintPages`.
 */
export function PrintFrame({ contact, t }: { contact: Contact; t: ReportT }) {
  return (
    <div aria-hidden="true" className="hidden print:block">
      <div className="fixed inset-[6mm] z-0 border-[1.6pt] border-kumkum">
        <div className="absolute inset-[1.2mm] border-[0.8pt] border-[#c99a3a]" />
        <Corner className="-top-[3mm] -left-[3mm]" />
        <Corner className="-top-[3mm] -right-[3mm]" />
        <Corner className="-bottom-[3mm] -left-[3mm]" />
        <Corner className="-right-[3mm] -bottom-[3mm]" />
      </div>
      <div className="fixed inset-x-[7.2mm] bottom-[7.2mm] z-20 flex h-[12mm] items-center gap-4 bg-sandhya px-[5mm] text-[8.5pt] text-[#f4e6d4]">
        <span className="flex items-center gap-2">
          <Diya className="-mt-1 size-[7mm]" />
          <span className="font-heading text-[12pt] leading-none whitespace-nowrap text-[#fbe3b6]">{t('cover.brand')}</span>
        </span>
        <span className="truncate text-[#f4e6d4]/75">{t('cover.footerNote')}</span>
        <span className="ml-auto flex items-center gap-4 whitespace-nowrap">
          <span className="flex items-center gap-1.5">
            <Globe className="size-[3.2mm] text-diya" />
            {WEBSITE}
          </span>
          {contact.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="size-[3.2mm] text-diya" />
              {contact.phone}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Mail className="size-[3.2mm] text-diya" />
            {contact.email}
          </span>
        </span>
      </div>
    </div>
  );
}

/**
 * On paper, header and footer rows of a table repeat on every page, so these empty rows keep
 * the report clear of the fixed frame and contact band. On screen they collapse away.
 */
export function PrintPages({ children }: { children: ReactNode }) {
  return (
    <table className="block w-full print:table print:border-collapse">
      <thead className="hidden print:table-header-group">
        <tr>
          <td className="h-[13mm] p-0" />
        </tr>
      </thead>
      <tbody className="block print:table-row-group">
        <tr className="block print:table-row">
          <td className="block p-0 print:table-cell print:px-[14mm]">{children}</td>
        </tr>
      </tbody>
      <tfoot className="hidden print:table-footer-group">
        <tr>
          <td className="h-[24mm] p-0" />
        </tr>
      </tfoot>
    </table>
  );
}

/** The twelve rashis as a ring, the birth lagna lit in saffron and the Moon's rashi marked. */
function RashiWheel({ lagna, moon, lang }: { lagna: number; moon: number; lang: Locale }) {
  const c = 150;
  const seg = (i: number, r1: number, r2: number) => {
    // Mesha starts at the top and the ring runs clockwise.
    const a1 = ((i * 30 - 90) * Math.PI) / 180;
    const a2 = (((i + 1) * 30 - 90) * Math.PI) / 180;
    const p = (r: number, a: number) => `${c + r * Math.cos(a)} ${c + r * Math.sin(a)}`;
    return `M${p(r1, a1)} A${r1} ${r1} 0 0 1 ${p(r1, a2)} L${p(r2, a2)} A${r2} ${r2} 0 0 0 ${p(r2, a1)} Z`;
  };
  const at = (i: number, r: number): [number, number] => {
    const a = ((i * 30 + 15 - 90) * Math.PI) / 180;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };
  return (
    <div className="relative size-[78mm]">
      <svg viewBox="0 0 300 300" aria-hidden="true" className="size-full">
        <circle cx={c} cy={c} r="146" fill="none" stroke="#e2a23b" strokeOpacity="0.5" strokeWidth="0.8" />
        {Array.from({ length: 27 }, (_, i) => {
          // 27 nakshatra marks on the outer rim
          const a = ((i * (360 / 27) - 90) * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={c + 138 * Math.cos(a)}
              y1={c + 138 * Math.sin(a)}
              x2={c + 146 * Math.cos(a)}
              y2={c + 146 * Math.sin(a)}
              stroke="#e2a23b"
              strokeWidth="1"
            />
          );
        })}
        {RASHI_NAMES[lang].map((name, i) => {
          const [x, y] = at(i, 112);
          const lit = i === lagna;
          return (
            <g key={name}>
              <path
                d={seg(i, 132, 92)}
                fill={lit ? '#c2410c' : i % 2 ? 'rgb(226 162 59 / 0.10)' : 'rgb(226 162 59 / 0.20)'}
                stroke="#e2a23b"
                strokeOpacity="0.7"
                strokeWidth="0.8"
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={lit ? '#fff4e0' : '#fbe3b6'}
                className={lang === 'en' ? 'text-[10px] font-medium' : 'text-[12px]'}
              >
                {name}
              </text>
            </g>
          );
        })}
        {(() => {
          const [x, y] = at(moon, 80);
          return <circle cx={x} cy={y} r="5" fill="#f4e6d4" stroke="#e2a23b" strokeWidth="1" />;
        })()}
        <circle cx={c} cy={c} r="62" fill="none" stroke="#e2a23b" strokeOpacity="0.6" strokeWidth="0.8" />
        <rect
          x={c - 34}
          y={c - 34}
          width="68"
          height="68"
          transform={`rotate(45 ${c} ${c})`}
          fill="none"
          stroke="#e2a23b"
          strokeWidth="1"
        />
        <rect
          x={c - 34}
          y={c - 34}
          width="68"
          height="68"
          fill="none"
          stroke="#e2a23b"
          strokeOpacity="0.6"
          strokeWidth="0.8"
        />
      </svg>
      <Diya className="absolute top-1/2 left-1/2 size-[12mm] -translate-x-1/2 -translate-y-[60%]" />
    </div>
  );
}

/** Label over value, centred; a cell of the cover's summary rows. */
function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 px-3 text-center">
      <p className="text-[9pt] text-[#f4e6d4]/70">{label}</p>
      <p className="mt-0.5 font-heading text-[13pt] leading-snug text-[#fbe3b6]">{children}</p>
    </div>
  );
}

function BirthLine({ p, lang, t }: { p: BirthDetails; lang: Locale; t: ReportT }) {
  return (
    <div className="grid grid-cols-3 divide-x divide-[#e2a23b]/30">
      <Stat label={t('birth.date')}>{fmtCivilDate(p.date, lang)}</Stat>
      <Stat label={t('birth.time')}>{fmtWallTime(p.time, lang)}</Stat>
      <Stat label={t('birth.place')}>{p.place.label.split(',')[0]}</Stat>
    </div>
  );
}

function CoverShell({
  t,
  title,
  children,
  prepared,
}: {
  t: ReportT;
  title: string;
  children: ReactNode;
  prepared: string;
}) {
  return (
    <section className="sandhya stars relative z-10 hidden h-[256mm] break-after-page flex-col items-center overflow-hidden px-[10mm] py-[9mm] text-center print:flex">
      <div className="flex items-center gap-2">
        <Diya className="-mt-1 size-[9mm]" />
        <span className="font-heading text-[16pt] leading-none whitespace-nowrap text-[#fbe3b6]">{t('cover.brand')}</span>
      </div>
      <p lang="sa" className="mt-[7mm] font-heading text-[14pt] text-diya">
        {t('hero.invocation')}
      </p>
      <div className="my-auto flex w-full flex-col items-center">
        <h1 className="text-[34pt] leading-tight">{title}</h1>
        {children}
      </div>
      <p className="pt-[4mm] text-[10pt]">{prepared}</p>
    </section>
  );
}

export function KundaliCover({
  person,
  name,
  lagna,
  moon,
  lagnaName,
  rashiName,
  nakshatra,
  prepared,
  lang,
  t,
}: {
  person: BirthDetails;
  name: string;
  lagna: number;
  moon: number;
  lagnaName: string;
  rashiName: string;
  nakshatra: string;
  prepared: string;
  lang: Locale;
  t: ReportT;
}) {
  return (
    <CoverShell t={t} title={t('report.title')} prepared={prepared}>
      <p className="mt-[2mm] font-heading text-[20pt] text-[#fbe3b6]">{name}</p>
      <div aria-hidden="true" className="toran mx-auto mt-[3mm] w-[60mm]" />
      <div className="my-[8mm]">
        <RashiWheel lagna={lagna} moon={moon} lang={lang} />
      </div>
      <div className="grid w-full max-w-[150mm] gap-[6mm]">
        <BirthLine p={person} lang={lang} t={t} />
        <div className="grid grid-cols-3 divide-x divide-[#e2a23b]/30">
          <Stat label={t('cover.lagna')}>{lagnaName}</Stat>
          <Stat label={t('cover.rashi')}>{rashiName}</Stat>
          <Stat label={t('cover.nakshatra')}>{nakshatra}</Stat>
        </div>
      </div>
      <p className="mt-[6mm] max-w-[120mm] text-[9pt]">{t('cover.wheelKey')}</p>
    </CoverShell>
  );
}

export function MilanCover({
  boy,
  girl,
  boyName,
  girlName,
  total,
  verdict,
  prepared,
  lang,
  t,
}: {
  boy: BirthDetails;
  girl: BirthDetails;
  boyName: string;
  girlName: string;
  total: number;
  verdict: string;
  prepared: string;
  lang: Locale;
  t: ReportT;
}) {
  const r = 70;
  const len = 2 * Math.PI * r;
  return (
    <CoverShell t={t} title={t('report.milanTitle')} prepared={prepared}>
      <div aria-hidden="true" className="toran mx-auto mt-[3mm] w-[60mm]" />
      <div className="my-[9mm] grid w-full grid-cols-[1fr_auto_1fr] items-center gap-[6mm]">
        <p className="text-right font-heading text-[18pt] leading-snug text-[#fbe3b6]">{boyName}</p>
        <div className="relative size-[52mm]">
          <svg viewBox="0 0 180 180" aria-hidden="true" className="size-full -rotate-90">
            <circle cx="90" cy="90" r={r} fill="none" stroke="rgb(226 162 59 / 0.22)" strokeWidth="12" />
            <circle
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke="#e2a23b"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(len * total) / 36} ${len}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-[30pt] leading-none text-[#fbe3b6]">{total}</span>
            <span className="mt-1 text-[9pt]">{t('cover.gunas')}</span>
          </div>
        </div>
        <p className="text-left font-heading text-[18pt] leading-snug text-[#fbe3b6]">{girlName}</p>
      </div>
      <p className="font-heading text-[16pt] text-diya">{verdict}</p>
      <div className="mt-[10mm] grid w-full max-w-[160mm] gap-[6mm] text-left">
        {(
          [
            [t('form.boy'), boy],
            [t('form.girl'), girl],
          ] as const
        ).map(([who, p]) => (
          <div key={who} className="grid gap-[2mm]">
            <p className="text-center text-[10pt] text-diya">{who}</p>
            <BirthLine p={p} lang={lang} t={t} />
          </div>
        ))}
      </div>
    </CoverShell>
  );
}
