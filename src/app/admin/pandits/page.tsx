'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, CircleAlert, ExternalLink, EyeOff, UsersRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AdminPandit, PanditVerificationStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { pick, useFormat, useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { PanditAvatar } from '@/components/common/pandit-avatar';
import { Rating } from '@/components/common/rating';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';
import { Field } from '@/components/dashboard/field';
import { errorMessage, useApi } from '@/components/dashboard/use-api';
import { FilterChips } from '@/components/admin/filter-chips';
import { maskAadhaar } from '@/components/pandit/kyc-card';

type Filter = 'pending' | 'all' | 'approved' | 'rejected' | 'incomplete';
const FILTERS: Filter[] = ['pending', 'all', 'approved', 'rejected', 'incomplete'];
const STATUS_OF: Record<Exclude<Filter, 'all'>, PanditVerificationStatus> = {
  pending: 'pending_review',
  approved: 'approved',
  rejected: 'rejected',
  incomplete: 'not_submitted',
};
const REASON_MIN = 5;

type Pending =
  | { kind: 'approve'; p: AdminPandit }
  | { kind: 'reject' | 'hide'; p: AdminPandit };

export default function AdminPanditsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <AdminPandits />
    </Suspense>
  );
}

const CHIP: Record<PanditVerificationStatus, string> = {
  pending_review: 'bg-diya/15 text-foreground ring-diya/50',
  approved: 'bg-tulsi/10 text-tulsi ring-tulsi/30',
  rejected: 'bg-destructive/10 text-destructive ring-destructive/30',
  not_submitted: 'bg-muted text-muted-foreground ring-border',
};

function StatusChip({ status }: { status: PanditVerificationStatus }) {
  const t = useT('admin');
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium ring-1', CHIP[status])}>
      {t(`pandits.status.${status}`)}
    </span>
  );
}

function AdminPandits() {
  const { token } = useAuth();
  const t = useT('admin');
  const tc = useT('common');
  const params = useSearchParams();
  const initial = params.get('filter');
  const [filter, setFilter] = useState<Filter>(
    FILTERS.includes(initial as Filter) ? (initial as Filter) : initial === 'verified' ? 'approved' : 'pending',
  );
  const pandits = useApi<AdminPandit[]>('/admin/pandits', token);
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const all = pandits.data ?? [];
  const count = (f: Filter) => (f === 'all' ? all.length : all.filter((p) => p.verification_status === STATUS_OF[f]).length);
  const list = filter === 'all' ? all : all.filter((p) => p.verification_status === STATUS_OF[filter]);

  const open = (next: Pending) => {
    setReason('');
    setReasonError(null);
    setPending(next);
  };

  const replace = (updated: AdminPandit) =>
    pandits.mutate((l) => (l ?? []).map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));

  const confirm = async () => {
    if (!pending) return;
    const { p, kind } = pending;
    try {
      if (kind === 'approve') {
        replace(await api<AdminPandit>(`/admin/pandits/${p.id}/approve`, { method: 'POST', token }));
        toast.success(t('pandits.toast.approved', { name: p.user.name }));
        return;
      }
      const text = reason.trim();
      if (text.length < REASON_MIN) {
        setReasonError(t('pandits.dialog.reasonRequired'));
        throw new Error('reason');
      }
      replace(await api<AdminPandit>(`/admin/pandits/${p.id}/reject`, { method: 'POST', token, body: { reason: text } }));
      toast.success(t(kind === 'hide' ? 'pandits.toast.hidden' : 'pandits.toast.rejected', { name: p.user.name }));
    } catch (e) {
      if (e instanceof Error && e.message === 'reason') throw e;
      const missing = e instanceof ApiError && e.status === 409 ? missingOf(e.payload) : null;
      toast.error(
        missing?.length
          ? t('pandits.missing', { items: missing.map((m) => t(`pandits.missing.${m}`)).join(', ') })
          : errorMessage(e),
      );
      throw e;
    }
  };

  const dialogKey = pending?.kind ?? 'approve';

  return (
    <>
      <PageHeader title={t('pandits.title')} description={t('pandits.desc')} />

      <div className="mb-6">
        <FilterChips<Filter>
          label={t('pandits.filterLabel')}
          value={filter}
          onChange={setFilter}
          options={FILTERS.map((f) => ({
            value: f,
            label: f === 'all' ? t('filter.all') : t(`pandits.filter.${f}`),
            count: pandits.data ? count(f) : undefined,
          }))}
        />
      </div>

      {pandits.loading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : pandits.error && !pandits.data ? (
        <EmptyState icon={CircleAlert} title={t('pandits.loadError')} action={<Button onClick={pandits.reload}>{tc('action.retry')}</Button>}>
          {pandits.error}
        </EmptyState>
      ) : list.length === 0 ? (
        <EmptyState icon={UsersRound} title={filter === 'pending' ? t('pandits.empty.pending.title') : t('pandits.empty.title')}>
          {filter === 'pending' ? t('pandits.empty.pending') : t('pandits.empty.body')}
        </EmptyState>
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {list.map((p) => (
            <PanditRow key={p.id} p={p} onAction={(kind) => open({ kind, p })} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        destructive={dialogKey !== 'approve'}
        title={t(`pandits.dialog.${dialogKey}.title`, { name: pending?.p.user.name ?? '' })}
        description={t(`pandits.dialog.${dialogKey}.desc`)}
        confirmLabel={t(`pandits.dialog.${dialogKey}.confirm`)}
        onConfirm={confirm}
      >
        {pending && pending.kind !== 'approve' && (
          <Field id="reject-reason" label={t('pandits.dialog.reason')} hint={t('pandits.dialog.reasonHint')} error={reasonError}>
            <Textarea
              id="reject-reason"
              value={reason}
              required
              maxLength={1000}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError && e.target.value.trim().length >= REASON_MIN) setReasonError(null);
              }}
              aria-invalid={!!reasonError}
              aria-describedby={reasonError ? 'reject-reason-error' : 'reject-reason-hint'}
            />
          </Field>
        )}
      </ConfirmDialog>
    </>
  );
}

type Missing = 'location' | 'services' | 'kyc';
const MISSING: Missing[] = ['location', 'services', 'kyc'];

/** The 409 from approve lists what the profile still lacks. */
function missingOf(payload: unknown): Missing[] | null {
  const m = (payload as { missing?: unknown } | null)?.missing;
  return Array.isArray(m) ? MISSING.filter((x) => m.includes(x)) : null;
}

function PanditRow({ p, onAction }: { p: AdminPandit; onAction: (kind: 'approve' | 'reject' | 'hide') => void }) {
  const t = useT('admin');
  const f = useFormat();
  const status = p.verification_status;
  const date = (d: string) => f.date(d, { weekday: undefined });
  const services = p.services ?? [];

  return (
    <li className="flex flex-col rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <PanditAvatar name={p.user.name} photo={p.user} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-medium break-words">{p.user.name}</p>
            <StatusChip status={status} />
          </div>
          <p className="text-sm break-all text-muted-foreground">{p.user.email}</p>
          <p className="text-sm text-muted-foreground">
            {p.user.mobile ?? t('pandits.noMobile')}
            {p.user.created_at && <> · {t('pandits.joined', { date: date(p.user.created_at) })}</>}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">{t('pandits.city')}</dt>
          <dd className="break-words">{p.city?.trim() || '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('pandits.experience')}</dt>
          <dd>{t('pandits.years', { count: Number(p.experience_years) || 0 })}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('pandits.kycSubmitted')}</dt>
          <dd>{p.kyc_submitted_at ? date(p.kyc_submitted_at) : t('pandits.kycNotSubmitted')}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('pandits.aadhaar')}</dt>
          <dd className="tracking-wider whitespace-nowrap tabular-nums">{p.aadhaar_number ? maskAadhaar(p.aadhaar_number) : '—'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">{t('pandits.pujas')}</dt>
          <dd>{services.length ? services.map((s) => pick(s, 'name', f.locale)).join(', ') : t('pandits.noPujas')}</dd>
        </div>
      </dl>

      {status === 'approved' && Number(p.total_reviews) > 0 && (
        <div className="mt-3">
          <Rating value={p.average_rating} count={Number(p.total_reviews) || 0} />
        </div>
      )}

      {p.verification_note && status === 'rejected' && (
        <p className="mt-3 rounded-lg bg-destructive/5 p-3 text-sm break-words">{t('pandits.reason', { reason: p.verification_note })}</p>
      )}
      {p.reviewed_at && status !== 'pending_review' && (
        <p className="mt-2 text-xs text-muted-foreground">{t('pandits.reviewed', { date: date(p.reviewed_at) })}</p>
      )}

      <details className="group mt-3 text-sm">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium text-primary underline-offset-4 hover:underline">
          {t('pandits.details')}
        </summary>
        <div className="grid gap-2 pb-2">
          <p className="whitespace-pre-line text-muted-foreground">{p.bio?.trim() || t('pandits.noBio')}</p>
          {p.languages?.length > 0 && (
            <p>
              <span className="text-muted-foreground">{t('pandits.languages')}:</span> {p.languages.join(', ')}
            </p>
          )}
          {p.tradition && (
            <p>
              <span className="text-muted-foreground">{t('pandits.tradition')}:</span> {p.tradition}
            </p>
          )}
          <p>{t('pandits.travel', { km: p.max_travel_distance_km })}</p>
          {p.offers_online && <p>{t('pandits.online')}</p>}
        </div>
      </details>

      {status !== 'not_submitted' && (
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-3">
        {(status === 'pending_review' || status === 'rejected') && (
          <Button onClick={() => onAction('approve')}>
            <Check aria-hidden="true" /> {t('pandits.action.approve')}
          </Button>
        )}
        {status === 'pending_review' && (
          <Button variant="outline" onClick={() => onAction('reject')}>
            <X aria-hidden="true" /> {t('pandits.action.reject')}
          </Button>
        )}
        {status === 'approved' && (
          <>
            <Button variant="outline" render={<Link href={`/pandits/${p.id}`} target="_blank" />} nativeButton={false}>
              <ExternalLink aria-hidden="true" /> {t('pandits.viewPublic')}
            </Button>
            <Button variant="ghost" className="text-destructive" onClick={() => onAction('hide')}>
              <EyeOff aria-hidden="true" /> {t('pandits.action.hide')}
            </Button>
          </>
        )}
      </div>
      )}
    </li>
  );
}
