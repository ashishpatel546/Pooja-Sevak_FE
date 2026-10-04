'use client';

import { useId, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, MessageCircle } from 'lucide-react';
import { useLocale, useT } from '@/i18n';
import { useAuth } from '@/lib/auth-context';
import { supportWhatsappUrl } from '@/lib/support';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/** Topic ids; `?topic=<id>` on /contact preselects one (e.g. `?topic=online&booking=<id>`). */
const TOPICS = ['booking', 'online', 'payment', 'pandit', 'other'] as const;
type Topic = (typeof TOPICS)[number];

/** Topic names in the WhatsApp message, kept in English for the support team. */
const TOPIC_EN: Record<Topic, string> = {
  booking: 'Booking help',
  online: 'Online puja problem',
  payment: 'Payment / refund',
  pandit: 'Become a pandit',
  other: 'Other',
};

const MESSAGE_MAX = 1000;
const BOOKING_MAX = 64;

const isTopic = (v: string | null): v is Topic => !!v && (TOPICS as readonly string[]).includes(v);
const cleanBooking = (v: string | null) => (v ?? '').replace(/[^\w-]/g, '').slice(0, BOOKING_MAX);

type Fields = { name: string; phone: string; booking: string; topic: Topic; message: string };
type Errors = Partial<Record<'name' | 'phone' | 'message', string>>;

/** Readable for support staff; `*bold*` is WhatsApp markup. */
function buildMessage(f: Fields, lang: string): string {
  const lines: (string | null)[] = [
    'Namaste Pooja Sevak support 🙏',
    '',
    `*Topic:* ${TOPIC_EN[f.topic]}`,
    `*Name:* ${f.name}`,
    f.phone ? `*Phone:* ${f.phone}` : null,
    f.booking ? `*Booking ID:* ${f.booking}` : null,
    `*Language:* ${lang}`,
    '',
    f.message,
  ];
  return lines.filter((l) => l !== null).join('\n');
}

export function WhatsappForm() {
  const t = useT('info');
  const { locale } = useLocale();
  const { user } = useAuth();
  const params = useSearchParams();
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;

  // null = untouched, so a signed-in visitor's name and mobile fill in once known.
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [booking, setBooking] = useState(() => cleanBooking(params.get('booking')));
  const [topic, setTopic] = useState<Topic>(() => {
    const p = params.get('topic');
    return isTopic(p) ? p : 'booking';
  });
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [sentUrl, setSentUrl] = useState<string | null>(null);

  const nameValue = name ?? user?.name ?? '';
  const phoneValue = phone ?? user?.mobile ?? '';

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f: Fields = {
      name: nameValue.trim(),
      phone: phoneValue.trim(),
      booking: booking.trim(),
      topic,
      message: message.trim(),
    };
    const next: Errors = {};
    if (!f.name) next.name = t('contact.wa.error.name');
    if (f.phone && f.phone.replace(/\D/g, '').length < 10) next.phone = t('contact.wa.error.phone');
    if (!f.message) next.message = t('contact.wa.error.message');
    setErrors(next);
    if (Object.keys(next).length) {
      const first = (['name', 'phone', 'message'] as const).find((k) => next[k]);
      if (first) document.getElementById(id(first))?.focus();
      return;
    }
    const url = supportWhatsappUrl(buildMessage(f, locale === 'hi' ? 'Hindi' : 'English'));
    window.open(url, '_blank', 'noopener,noreferrer');
    setSentUrl(url);
  };

  const errProps = (k: keyof Errors, hint?: string) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': [errors[k] ? id(`${k}-error`) : null, hint ?? null].filter(Boolean).join(' ') || undefined,
  });

  const errorText = (k: keyof Errors) =>
    errors[k] && (
      <p id={id(`${k}-error`)} className="flex items-start gap-1.5 text-sm text-destructive">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {errors[k]}
      </p>
    );

  // Fields have no `name`: a submit before hydration must not put personal details in the URL.
  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid min-w-0 gap-2">
          <Label htmlFor={id('name')}>
            {t('contact.wa.name')} <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id={id('name')}
            autoComplete="name"
            required
            maxLength={100}
            value={nameValue}
            onChange={(e) => setName(e.target.value)}
            {...errProps('name')}
          />
          {errorText('name')}
        </div>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor={id('phone')}>
            {t('contact.wa.phone')} <span className="font-normal text-muted-foreground">{t('contact.wa.optional')}</span>
          </Label>
          <Input
            id={id('phone')}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            value={phoneValue}
            onChange={(e) => setPhone(e.target.value)}
            {...errProps('phone')}
          />
          {errorText('phone')}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid min-w-0 gap-2">
          <Label htmlFor={id('topic')}>{t('contact.wa.topic')}</Label>
          <select
            id={id('topic')}
            value={topic}
            onChange={(e) => setTopic(e.target.value as Topic)}
            className="h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:text-sm dark:bg-input/30"
          >
            {TOPICS.map((k) => (
              <option key={k} value={k}>
                {t(`contact.wa.topic.${k}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor={id('booking')}>
            {t('contact.wa.booking')} <span className="font-normal text-muted-foreground">{t('contact.wa.optional')}</span>
          </Label>
          <Input
            id={id('booking')}
            autoComplete="off"
            spellCheck={false}
            maxLength={BOOKING_MAX}
            value={booking}
            onChange={(e) => setBooking(e.target.value)}
            aria-describedby={id('booking-hint')}
          />
          <p id={id('booking-hint')} className="text-xs text-muted-foreground">
            {t('contact.wa.bookingHint')}
          </p>
        </div>
      </div>

      <div className="grid min-w-0 gap-2">
        <Label htmlFor={id('message')}>
          {t('contact.wa.message')} <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Textarea
          id={id('message')}
          required
          rows={5}
          maxLength={MESSAGE_MAX}
          placeholder={t('contact.wa.messagePlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-32"
          {...errProps('message', id('message-count'))}
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">{errorText('message')}</div>
          <p id={id('message-count')} className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {message.length}/{MESSAGE_MAX}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" className="h-12 w-full sm:w-auto sm:px-6">
          <MessageCircle aria-hidden="true" />
          {t('contact.wa.submit')}
        </Button>
        <p className="text-sm text-muted-foreground">{t('contact.wa.submitHint')}</p>
      </div>

      <div aria-live="polite">
        {sentUrl && (
          <p className="flex items-start gap-2 rounded-xl border bg-chandan p-3 text-sm">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              {t('contact.wa.opened')}{' '}
              <a
                href={sentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-4"
              >
                {t('contact.wa.openAgain')}
              </a>
            </span>
          </p>
        )}
      </div>
    </form>
  );
}
