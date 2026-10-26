'use client';

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Clock } from 'lucide-react';
import { useLocale, useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fmtWallTime } from './report-kit';

type Mode = 'hour' | 'minute';

const pad = (n: number) => String(n).padStart(2, '0');
const DIAL = 240;
const R = 92; // radius of the number ring

/** Position on the ring for a value out of `steps`, 12 o'clock first. */
function ringPoint(value: number, steps: number): [number, number] {
  const a = (value / steps) * 2 * Math.PI;
  return [DIAL / 2 + R * Math.sin(a), DIAL / 2 - R * Math.cos(a)];
}

/**
 * Birth time picked on a clock face: hour first, then minute (any minute, by dragging or with the arrow keys).
 * Value is 24-hour "HH:mm", or '' while unset.
 */
export function TimePicker({
  id,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const t = useT('kundali');
  const tc = useT('common');
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('hour');
  const [h24, setH24] = useState(6);
  const [min, setMin] = useState(0);
  const dragging = useRef(false);

  const pm = h24 >= 12;
  const h12 = h24 % 12 || 12;

  const start = () => {
    const [h, m] = value ? value.split(':').map(Number) : [6, 0];
    setH24(h);
    setMin(m);
    setMode('hour');
    setOpen(true);
  };

  const setHour12 = (h: number) => setH24((h % 12) + (pm ? 12 : 0));
  const setPm = (next: boolean) => setH24((h) => (h % 12) + (next ? 12 : 0));

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    const turn = (Math.atan2(x, -y) / (2 * Math.PI) + 1) % 1;
    if (mode === 'hour') setHour12(Math.round(turn * 12) % 12 || 12);
    else setMin(Math.round(turn * 60) % 60);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 }[e.key];
    if (step) {
      e.preventDefault();
      if (mode === 'hour') setHour12((((h12 - 1 + step) % 12) + 12) % 12 + 1);
      else setMin((((min + step) % 60) + 60) % 60);
    } else if (e.key === 'Enter' && mode === 'hour') {
      e.preventDefault();
      setMode('minute');
    }
  };

  const current = mode === 'hour' ? h12 % 12 : min;
  const [hx, hy] = ringPoint(current, mode === 'hour' ? 12 : 60);
  const marks = mode === 'hour' ? Array.from({ length: 12 }, (_, i) => i + 1) : Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <>
      <button
        id={id}
        type="button"
        onClick={start}
        data-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-haspopup="dialog"
        className={cn(
          'flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-invalid:border-destructive dark:bg-input/30',
          !value && 'text-muted-foreground',
        )}
      >
        {value ? fmtWallTime(value, locale) : t('time.choose')}
        <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>{t('form.time')}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-center gap-3">
            <div className="flex items-baseline font-heading text-5xl tabular-nums">
              {(['hour', 'minute'] as const).map((m, i) => (
                <span key={m} className="flex items-baseline">
                  {i === 1 && <span className="px-0.5 text-muted-foreground">:</span>}
                  <button
                    type="button"
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    aria-label={m === 'hour' ? t('time.hour') : t('time.minute')}
                    className={cn(
                      'rounded-lg px-1.5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                      mode === m ? 'bg-accent text-primary' : 'text-heading hover:bg-muted',
                    )}
                  >
                    {m === 'hour' ? pad(h12) : pad(min)}
                  </button>
                </span>
              ))}
            </div>
            <div role="group" aria-label={t('time.period')} className="grid gap-1">
              {([false, true] as const).map((p) => (
                <button
                  key={String(p)}
                  type="button"
                  onClick={() => setPm(p)}
                  aria-pressed={pm === p}
                  className={cn(
                    'min-h-8 rounded-md border px-2 text-sm font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                    pm === p ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted',
                  )}
                >
                  {p ? t('time.pm') : t('time.am')}
                </button>
              ))}
            </div>
          </div>

          <div
            role="slider"
            tabIndex={0}
            aria-label={mode === 'hour' ? t('time.hour') : t('time.minute')}
            aria-valuemin={mode === 'hour' ? 1 : 0}
            aria-valuemax={mode === 'hour' ? 12 : 59}
            aria-valuenow={mode === 'hour' ? h12 : min}
            aria-valuetext={fmtWallTime(`${pad(h24)}:${pad(min)}`, locale)}
            onKeyDown={onKey}
            onPointerDown={(e) => {
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              pick(e);
            }}
            onPointerMove={(e) => dragging.current && pick(e)}
            onPointerUp={() => {
              dragging.current = false;
              if (mode === 'hour') setMode('minute');
            }}
            className="relative mx-auto aspect-square w-full max-w-60 cursor-pointer touch-none rounded-full bg-accent/50 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <svg viewBox={`0 0 ${DIAL} ${DIAL}`} className="absolute inset-0 size-full" aria-hidden="true">
              <line x1={DIAL / 2} y1={DIAL / 2} x2={hx} y2={hy} className="stroke-primary [stroke-width:2]" />
              <circle cx={DIAL / 2} cy={DIAL / 2} r="4" className="fill-primary" />
              <circle cx={hx} cy={hy} r="17" className="fill-primary" />
              {mode === 'minute' && min % 5 !== 0 && <circle cx={hx} cy={hy} r="3" className="fill-primary-foreground" />}
              {marks.map((v) => {
                const [x, y] = ringPoint(mode === 'hour' ? v % 12 : v, mode === 'hour' ? 12 : 60);
                const on = mode === 'hour' ? v === h12 : v === min;
                return (
                  <text
                    key={v}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={cn('text-[15px] tabular-nums', on ? 'fill-primary-foreground font-semibold' : 'fill-foreground')}
                  >
                    {mode === 'hour' ? v : pad(v)}
                  </text>
                );
              })}
            </svg>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'hour' ? t('time.hintHour') : t('time.hintMinute')}
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tc('action.cancel')}
            </Button>
            <Button
              onClick={() => {
                onChange(`${pad(h24)}:${pad(min)}`);
                setOpen(false);
              }}
            >
              {t('time.set', { time: fmtWallTime(`${pad(h24)}:${pad(min)}`, locale) })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
