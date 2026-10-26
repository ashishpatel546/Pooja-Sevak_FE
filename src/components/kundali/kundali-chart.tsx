import { cn } from '@/lib/utils';

export type ChartStyle = 'north' | 'south';

/** One body to draw: a graha (or the lagna) in a sidereal sign. */
export type ChartPlacement = { key: string; label: string; sign: number };

type Pt = [number, number];

// ── North Indian: fixed houses, signs rotate. House 1 is the top diamond, counted anticlockwise.
const NORTH_HOUSES: { poly: Pt[]; at: Pt; num: Pt }[] = [
  { poly: [[150, 0], [225, 75], [150, 150], [75, 75]], at: [150, 70], num: [150, 136] },
  { poly: [[0, 0], [150, 0], [75, 75]], at: [75, 24], num: [75, 62] },
  { poly: [[0, 0], [75, 75], [0, 150]], at: [24, 75], num: [60, 79] },
  { poly: [[0, 150], [75, 75], [150, 150], [75, 225]], at: [70, 150], num: [136, 154] },
  { poly: [[0, 150], [75, 225], [0, 300]], at: [24, 225], num: [60, 229] },
  { poly: [[0, 300], [75, 225], [150, 300]], at: [75, 278], num: [75, 244] },
  { poly: [[150, 300], [75, 225], [150, 150], [225, 225]], at: [150, 232], num: [150, 170] },
  { poly: [[150, 300], [225, 225], [300, 300]], at: [225, 278], num: [225, 244] },
  { poly: [[300, 300], [225, 225], [300, 150]], at: [276, 225], num: [240, 229] },
  { poly: [[300, 150], [225, 225], [150, 150], [225, 75]], at: [230, 150], num: [164, 154] },
  { poly: [[300, 150], [225, 75], [300, 0]], at: [276, 75], num: [240, 79] },
  { poly: [[300, 0], [225, 75], [150, 0]], at: [225, 24], num: [225, 62] },
];

// ── South Indian: fixed signs in a 4×4 ring, Meena top-left, running clockwise.
const SOUTH_CELL: Pt[] = [
  [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [3, 3], [2, 3], [1, 3], [0, 3], [0, 2], [0, 1], [0, 0],
];

/** Labels in rows of `perRow`, centred on (x, y). */
function Labels({ x, y, labels, perRow, lagnaKey }: { x: number; y: number; labels: ChartPlacement[]; perRow: number; lagnaKey?: string }) {
  const rows: ChartPlacement[][] = [];
  for (let i = 0; i < labels.length; i += perRow) rows.push(labels.slice(i, i + perRow));
  const lineH = 13;
  const top = y - ((rows.length - 1) * lineH) / 2;
  return (
    <>
      {rows.map((row, r) => (
        <text
          key={r}
          x={x}
          y={top + r * lineH}
          textAnchor="middle"
          dominantBaseline="middle"
          // Latin abbreviations read lighter than Devanagari at the same size; even them out.
          className={/[A-Za-z]/.test(row[0].label) ? 'text-[12px] font-medium' : 'text-[11px]'}
        >
          {row.map((p, i) => (
            <tspan
              key={p.key}
              dx={i === 0 ? 0 : 4}
              className={cn(p.key === lagnaKey ? 'fill-sindoor font-semibold' : 'fill-foreground')}
            >
              {p.label}
            </tspan>
          ))}
        </text>
      ))}
    </>
  );
}

export function KundaliChart({
  style,
  lagnaSign,
  placements,
  signShort,
  title,
  ariaLabel,
  className,
}: {
  style: ChartStyle;
  lagnaSign: number;
  /** Include the lagna itself as a placement with key 'la'. */
  placements: ChartPlacement[];
  /** Short sign names for the South Indian chart, index 0 = Mesha. */
  signShort: string[];
  title: string;
  ariaLabel: string;
  className?: string;
}) {
  const inSign = (sign: number) => placements.filter((p) => p.sign === sign);
  const line = 'fill-none stroke-diya/80 [stroke-width:1.25]';

  return (
    <figure className={cn('mx-auto w-full max-w-[22rem] print:break-inside-avoid', className)}>
      <svg viewBox="-2 -2 304 304" role="img" aria-label={ariaLabel} className="h-auto w-full font-sans">
        <rect x="0" y="0" width="300" height="300" rx="6" className="fill-card stroke-diya [stroke-width:1.5]" />
        {style === 'north' ? (
          <>
            <polygon points="150,0 225,75 150,150 75,75" className="fill-accent/45" />
            <path d="M0 0 L300 300 M300 0 L0 300 M150 0 L300 150 L150 300 L0 150 Z" className={line} />
            {NORTH_HOUSES.map((h, i) => {
              const sign = (lagnaSign + i) % 12;
              return (
                <g key={i}>
                  <text x={h.num[0]} y={h.num[1]} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[10px]">
                    {sign + 1}
                  </text>
                  <Labels x={h.at[0]} y={h.at[1]} labels={inSign(sign)} perRow={i % 3 === 0 ? 3 : 2} lagnaKey="la" />
                </g>
              );
            })}
          </>
        ) : (
          <>
            <path
              d="M0 75 H300 M0 225 H300 M75 0 V300 M225 0 V300 M150 0 V75 M150 225 V300 M0 150 H75 M225 150 H300"
              className={line}
            />
            {SOUTH_CELL.map(([c, r], sign) => {
              const x = c * 75;
              const y = r * 75;
              const isLagna = sign === lagnaSign;
              return (
                <g key={sign}>
                  {isLagna && (
                    <>
                      <rect x={x} y={y} width="75" height="75" className="fill-accent/45" />
                      <path d={`M${x} ${y + 18} L${x + 18} ${y}`} className="stroke-sindoor [stroke-width:1.5]" />
                    </>
                  )}
                  <text x={x + 72} y={y + 10} textAnchor="end" className="fill-muted-foreground text-[9px]">
                    {signShort[sign]}
                  </text>
                  <Labels
                    x={x + 37.5}
                    y={y + 42}
                    labels={inSign(sign).filter((p) => p.key !== 'la')}
                    perRow={2}
                  />
                </g>
              );
            })}
            <text x="150" y="150" textAnchor="middle" dominantBaseline="middle" className="fill-heading font-heading text-[15px]">
              {title}
            </text>
          </>
        )}
      </svg>
      {style === 'north' && (
        <figcaption className="mt-2 text-center font-heading text-base text-heading">{title}</figcaption>
      )}
    </figure>
  );
}
