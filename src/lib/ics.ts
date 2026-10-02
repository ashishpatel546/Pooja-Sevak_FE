// Minimal RFC 5545 (iCalendar) writer for a single event, generated in the browser.
// CRLF line endings, 75-octet line folding (never splitting a UTF-8 character),
// escaped TEXT values, UTC timestamps and an optional display alarm.

export type IcsEvent = {
  /** Globally unique id, e.g. `booking-<id>@poojasevak.in`. */
  uid: string;
  start: Date | string;
  end: Date | string;
  summary: string;
  description?: string;
  location?: string;
  url?: string;
  /** Minutes before start for a display reminder; omit for none. */
  alarmMinutesBefore?: number;
  alarmText?: string;
};

const CRLF = '\r\n';
const encoder = new TextEncoder();

/** 20261002T043000Z */
export function icsUtc(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

/** Escapes a TEXT value: backslash, semicolon, comma and newlines. */
export function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/** Folds a content line at 75 octets; continuation lines start with one space. */
export function icsFold(line: string): string {
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    // First line may hold 75 octets; continuations hold 74 plus the leading space.
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      out.push(current);
      current = '';
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join(`${CRLF} `);
}

export function buildIcs(event: IcsEvent, now: Date = new Date()): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pooja Sevak//Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${icsUtc(now)}`,
    `DTSTART:${icsUtc(event.start)}`,
    `DTEND:${icsUtc(event.end)}`,
    `SUMMARY:${icsEscape(event.summary)}`,
  ];
  if (event.location) lines.push(`LOCATION:${icsEscape(event.location)}`);
  if (event.description) lines.push(`DESCRIPTION:${icsEscape(event.description)}`);
  if (event.url) lines.push(`URL:${event.url}`);
  if (event.alarmMinutesBefore !== undefined) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${icsEscape(event.alarmText ?? event.summary)}`,
      `TRIGGER:-PT${Math.max(0, Math.round(event.alarmMinutesBefore))}M`,
      'END:VALARM',
    );
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(icsFold).join(CRLF) + CRLF;
}

/** Triggers a download of `content` as an .ics file. Browser only. */
export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}
