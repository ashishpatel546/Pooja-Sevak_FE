'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SendHorizontal, ShieldAlert } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { ChatBlocked, ChatMessage, ChatThread } from '@/lib/types';
import { useFormat, useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { errorMessage } from '@/components/dashboard/use-api';

/** New messages are fetched this often while the chat is on screen. */
const POLL_MS = 5_000;
const POLL_HIDDEN_MS = 30_000;
const MAX_LENGTH = 1000;

function isBlocked(e: unknown): ChatBlocked | null {
  if (!(e instanceof ApiError) || e.status !== 422) return null;
  const p = e.payload as Partial<ChatBlocked> | null;
  return p?.code === 'CONTACT_INFO_BLOCKED' ? (p as ChatBlocked) : null;
}

/** Merge fetched messages into the list without duplicates, oldest first. */
function mergeMessages(prev: ChatMessage[], next: ChatMessage[]) {
  const seen = new Set(prev.map((m) => m.id));
  const added = next.filter((m) => !seen.has(m.id));
  return added.length ? [...prev, ...added] : prev;
}

/**
 * Text chat between the family and the pandit of one booking. Messages with
 * phone numbers, email, UPI IDs, links or social apps are refused by the
 * server; the sender sees why and how many attempts are on record.
 */
export function ChatPanel({
  bookingId,
  token,
  otherName,
  className,
  autoFocus = false,
}: {
  bookingId: string;
  token: string | null;
  /** Shown above the other side's messages. */
  otherName?: string | null;
  className?: string;
  autoFocus?: boolean;
}) {
  const t = useT('chat');
  const f = useFormat();
  const [thread, setThread] = useState<Omit<ChatThread, 'messages'> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState<ChatBlocked | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<string | null>(null);

  const fetchNew = useCallback(async () => {
    if (!token) return;
    try {
      const after = lastRef.current;
      const res = await api<ChatThread>(`/bookings/${bookingId}/chat`, {
        token,
        query: after ? { after } : undefined,
      });
      const { messages: got, ...meta } = res;
      setThread(meta);
      if (got.length) {
        lastRef.current = got[got.length - 1].created_at;
        setMessages((prev) => mergeMessages(prev, got));
      }
      setLoadError(null);
    } catch (e) {
      setLoadError(errorMessage(e, t('loadError')));
    }
  }, [bookingId, token, t]);

  // First load (render one panel per booking: key it by the booking id).
  useEffect(() => {
    void fetchNew();
  }, [fetchNew]);

  // Poll while open: often when visible, rarely in a background tab. A
  // closed chat (completed/cancelled) does not change, so it is not polled.
  const open = !!thread?.can_send;
  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let id: number | undefined;
    const tick = () => {
      id = window.setTimeout(
        async () => {
          await fetchNew();
          if (!stopped) tick();
        },
        document.visibilityState === 'visible' ? POLL_MS : POLL_HIDDEN_MS,
      );
    };
    tick();
    return () => {
      stopped = true;
      window.clearTimeout(id);
    };
  }, [open, fetchNew]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setBlocked(null);
    setSendError(null);
    try {
      const msg = await api<ChatMessage>(`/bookings/${bookingId}/chat`, {
        method: 'POST',
        token,
        body: { body },
      });
      setMessages((prev) => mergeMessages(prev, [msg]));
      lastRef.current = msg.created_at;
      setText('');
    } catch (err) {
      const b = isBlocked(err);
      if (b) {
        setBlocked(b);
        setThread((prev) => (prev ? { ...prev, strikes: b.strikes } : prev));
      } else setSendError(errorMessage(err, t('sendFailed')));
    } finally {
      setSending(false);
    }
  };

  const me = thread?.me;
  const otherLabel = otherName || (me === 'pandit' ? t('family') : t('pandit'));
  const reasonList = blocked
    ? new Intl.ListFormat(f.locale === 'en' ? 'en' : 'hi', { type: 'disjunction' }).format(
        blocked.reasons.map((r) => t(`reason.${r}`)),
      )
    : '';

  return (
    <div className={cn('grid gap-3', className)}>
      <p className="flex gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{t(me === 'pandit' ? 'safety.pandit' : 'safety.customer')}</span>
      </p>

      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label={t('title')}
        className="grid max-h-[50vh] min-h-40 content-start gap-2 overflow-y-auto rounded-xl border bg-background p-3"
      >
        {!thread && !loadError ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : loadError && !thread ? (
          <p role="alert" className="text-sm text-destructive">
            {loadError}
          </p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(me === 'pandit' ? 'empty.pandit' : 'empty.customer')}</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_role === me;
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                    mine ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-muted',
                  )}
                >
                  {!mine && <p className="mb-0.5 text-xs font-medium opacity-80">{otherLabel}</p>}
                  <p className="break-words whitespace-pre-wrap">{m.body}</p>
                  <p className={cn('mt-0.5 text-right text-[0.7rem]', mine ? 'opacity-80' : 'text-muted-foreground')}>
                    {f.time(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {blocked && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p className="font-medium text-destructive">{t('blocked.title')}</p>
          <p>{t('blocked.body', { what: reasonList })}</p>
          <p className="mt-1 text-muted-foreground">{t.plural('blocked.strikes', blocked.strikes)}</p>
        </div>
      )}

      {thread && !thread.can_send ? (
        <p className="text-sm text-muted-foreground">{t(`closed.${thread.closed_reason ?? 'unpaid'}`)}</p>
      ) : thread ? (
        <form onSubmit={send} className="grid gap-2">
          <div className="flex items-end gap-2">
            <Textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, MAX_LENGTH));
                if (blocked) setBlocked(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={t('placeholder')}
              aria-label={t('placeholder')}
              rows={2}
              maxLength={MAX_LENGTH}
              autoFocus={autoFocus}
              className="min-h-11 flex-1 resize-none"
            />
            <Button type="submit" size="icon-lg" disabled={sending || !text.trim()} aria-label={sending ? t('sending') : t('send')}>
              <SendHorizontal aria-hidden="true" />
            </Button>
          </div>
          {text.length > MAX_LENGTH * 0.8 && (
            <p className="text-right text-xs text-muted-foreground">{t('counter', { count: text.length })}</p>
          )}
          {sendError && (
            <p role="alert" className="text-sm text-destructive">
              {sendError}
            </p>
          )}
        </form>
      ) : null}
    </div>
  );
}
