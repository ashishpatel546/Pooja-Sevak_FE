'use client';

import { useState } from 'react';
import { Check, MessageSquareWarning, ShieldAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AdminChatFlag, AdminChatThread, ChatFlagStatus } from '@/lib/types';
import { pick, useFormat, useLocale, useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';
import { errorMessage, useApi } from '@/components/dashboard/use-api';

const TABS: ChatFlagStatus[] = ['open', 'warned', 'dismissed'];

/** A booking's whole chat, blocked attempts included. Each opening is logged by the API. */
function Thread({ flag, token }: { flag: AdminChatFlag; token: string | null }) {
  const t = useT('chat');
  const f = useFormat();
  const thread = useApi<AdminChatThread>(
    flag.booking ? `/admin/chat/bookings/${flag.booking.id}?context=flag:${flag.id}` : null,
    token,
  );
  if (thread.loading) return <Skeleton className="h-32 rounded-xl" />;
  if (!thread.data) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {thread.error}
      </p>
    );
  }
  const d = thread.data;
  return (
    <div className="grid max-h-[60vh] gap-2 overflow-y-auto rounded-xl border bg-background p-3">
      {d.messages.length === 0 && <p className="text-sm text-muted-foreground">{t('admin.thread.empty')}</p>}
      {d.messages.map((m) => {
        const pandit = m.sender_role === 'pandit';
        return (
          <div key={m.id} className={cn('flex', pandit ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                m.blocked ? 'border border-dashed border-destructive/60 bg-destructive/5' : 'bg-muted',
                m.id === flag.id && 'ring-2 ring-destructive/40',
              )}
            >
              <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                {pandit ? d.pandit_name : d.customer_name} · {f.dateTime(m.created_at)}
              </p>
              <p className="break-words whitespace-pre-wrap">{m.body}</p>
              {m.blocked && (
                <p className="mt-1 text-xs text-destructive">
                  {t('admin.thread.blocked')}: {m.reasons.map((r) => t(`reason.${r}`)).join(', ')}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FlagCard({
  flag,
  token,
  onReview,
}: {
  flag: AdminChatFlag;
  token: string | null;
  onReview: (kind: 'warned' | 'dismissed', flag: AdminChatFlag) => void;
}) {
  const t = useT('chat');
  const ta = useT('admin');
  const f = useFormat();
  const { locale } = useLocale();
  const [showThread, setShowThread] = useState(false);
  const b = flag.booking;
  const pandit = flag.sender_role === 'pandit';
  return (
    <li className="grid gap-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-medium">
            {flag.sender_name ?? '—'}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              · {t(pandit ? 'admin.sender.pandit' : 'admin.sender.customer')}
            </span>
          </p>
          {b && (
            <p className="text-sm text-muted-foreground">
              {t('admin.booking', {
                puja: b.puja ? pick(b.puja, 'name', locale) : ta('puja.fallback'),
                date: f.date(b.start_time, { weekday: undefined }),
                customer: b.customer_name ?? '—',
                pandit: b.pandit_name ?? '—',
              })}
            </p>
          )}
        </div>
        <span
          className={cn(
            'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium ring-1 ring-inset',
            flag.sender_strikes >= 3
              ? 'bg-destructive/10 text-destructive ring-destructive/30'
              : 'bg-accent text-accent-foreground ring-diya/40',
          )}
        >
          <ShieldAlert className="size-3.5" aria-hidden="true" />
          {t.plural('admin.strikes', flag.sender_strikes)}
        </span>
      </div>

      <div className="rounded-lg border border-dashed border-destructive/50 bg-destructive/5 p-3 text-sm">
        <p className="text-xs text-muted-foreground">
          {t('admin.blockedText')} · {f.dateTime(flag.created_at)} ·{' '}
          {flag.reasons.map((r) => t(`reason.${r}`)).join(', ')}
        </p>
        <p className="mt-1 break-words whitespace-pre-wrap">{flag.body}</p>
      </div>

      {flag.status !== 'open' && (
        <p className="text-sm text-muted-foreground">
          {flag.reviewed_at && t('admin.reviewedOn', { date: f.dateTime(flag.reviewed_at) })}
          {flag.review_note && ` · ${flag.review_note}`}
        </p>
      )}
      {pandit && flag.sender_strikes >= 3 && <p className="text-sm text-destructive">{t('admin.suspendHint')}</p>}

      {showThread && <Thread flag={flag} token={token} />}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setShowThread((v) => !v)} disabled={!b}>
          {showThread ? t('admin.hideChat') : t('admin.viewChat')}
        </Button>
        {flag.status === 'open' && (
          <>
            <Button onClick={() => onReview('warned', flag)}>
              <Check aria-hidden="true" />
              {t('admin.warn')}
            </Button>
            <Button variant="outline" onClick={() => onReview('dismissed', flag)}>
              <X aria-hidden="true" />
              {t('admin.dismiss')}
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

export default function AdminChatsPage() {
  const { token } = useAuth();
  const t = useT('chat');
  const tc = useT('common');
  const [status, setStatus] = useState<ChatFlagStatus>('open');
  const flags = useApi<AdminChatFlag[]>(`/admin/chat/flags?status=${status}`, token);
  const [pending, setPending] = useState<{ kind: 'warned' | 'dismissed'; flag: AdminChatFlag } | null>(null);
  const [note, setNote] = useState('');

  const close = () => {
    setPending(null);
    setNote('');
  };

  const run = async () => {
    if (!pending) return;
    try {
      await api(`/admin/chat/flags/${pending.flag.id}/review`, {
        method: 'POST',
        token,
        body: { status: pending.kind, note: note.trim() || undefined },
      });
      toast.success(t(pending.kind === 'warned' ? 'admin.warned' : 'admin.dismissed'));
      close();
      flags.reload();
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    }
  };

  return (
    <>
      <PageHeader title={t('admin.title')} description={t('admin.desc')} />
      <Tabs value={status} onValueChange={(v) => setStatus(v as ChatFlagStatus)} className="mb-6">
        <TabsList className="h-11!">
          {TABS.map((s) => (
            <TabsTrigger key={s} value={s} className="min-h-9 px-3">
              {t(`admin.tab.${s}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {flags.loading ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : !flags.data ? (
        <EmptyState icon={MessageSquareWarning} title={t('loadError')} action={<Button onClick={flags.reload}>{tc('action.retry')}</Button>}>
          {flags.error}
        </EmptyState>
      ) : flags.data.length === 0 ? (
        <EmptyState icon={MessageSquareWarning} title={t('admin.empty')} />
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {flags.data.map((fl) => (
            <FlagCard key={fl.id} flag={fl} token={token} onReview={(kind, flag) => setPending({ kind, flag })} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && close()}
        destructive={pending?.kind === 'warned'}
        title={
          pending?.kind === 'warned'
            ? t('admin.warnTitle', { name: pending.flag.sender_name ?? '—' })
            : t('admin.dismissTitle')
        }
        description={pending?.kind === 'warned' ? t('admin.warnDesc') : t('admin.dismissDesc')}
        confirmLabel={pending?.kind === 'warned' ? t('admin.warn') : t('admin.dismiss')}
        onConfirm={run}
      >
        {pending?.kind === 'warned' && (
          <div className="grid gap-2">
            <Label htmlFor="flag-note">{t('admin.note')}</Label>
            <Textarea id="flag-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
