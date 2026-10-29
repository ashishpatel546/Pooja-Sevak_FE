'use client';

import { CircleAlert, Copy, Gift, Share2, TicketPercent, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { useFormat, useT } from '@/i18n';
import type { MyCoupon, ReferralMe, ReferralStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader, PageShell } from '@/components/common/page-header';
import { useApiQuery } from '@/components/customer/use-api';
import { useRequireCustomer } from '@/components/customer/use-require-customer';
import { CustomerOnly } from '@/components/customer/wrong-role';
import { cn } from '@/lib/utils';

const STATUS_TONE: Record<ReferralStatus, string> = {
  signed_up: 'bg-muted text-foreground/80',
  first_puja_done: 'bg-accent text-accent-foreground',
  reward_issued: 'bg-tulsi/15 text-tulsi',
};

export default function ReferPage() {
  const { ready, wrongRole, token } = useRequireCustomer();
  const t = useT('growth');
  const tc = useT('common');
  const f = useFormat();
  const me = useApiQuery<ReferralMe>(ready ? '/referrals/me' : null, { token });

  if (wrongRole) return <CustomerOnly />;

  const d = me.data;
  const amount = d ? f.inr(d.reward_paise / 100) : '';
  const shareText = d ? t('refer.shareText', { amount, url: d.share_url }) : '';

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t('refer.copied'));
    } catch {
      toast.error(t('refer.copyFailed'));
    }
  };
  const share = async () => {
    if (!d) return;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch {
        // dismissed: fall back to copying
      }
    }
    await copy(shareText);
  };

  return (
    <PageShell>
      <PageHeader title={t('refer.title')} description={d ? t('refer.subtitle', { amount }) : undefined} />
      {!d && me.loading ? (
        <div className="grid gap-4">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : !d ? (
        <EmptyState icon={CircleAlert} title={t('refer.loadError')} action={<Button onClick={me.reload}>{tc('action.retry')}</Button>}>
          {me.error}
        </EmptyState>
      ) : (
        <div className="grid gap-6">
          {!d.enabled && (
            <p role="status" className="rounded-xl bg-muted px-4 py-3 text-sm">
              {t('refer.disabled')}
            </p>
          )}

          {d.enabled && (
            <section className="rounded-2xl border border-diya/40 bg-gradient-to-br from-diya/10 via-card to-accent/30 p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-diya/20 text-diya">
                  <Gift className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">{t('refer.code')}</p>
                  <p className="font-mono text-3xl font-semibold tracking-widest">{d.code}</p>
                </div>
                <Button variant="outline" className="ml-auto min-h-11" onClick={() => copy(d.code)}>
                  <Copy aria-hidden="true" /> {t('refer.copy')}
                </Button>
              </div>

              <label htmlFor="refer-link" className="mt-5 block text-sm text-muted-foreground">
                {t('refer.link')}
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="refer-link"
                  readOnly
                  value={d.share_url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-h-11 w-full min-w-0 rounded-lg border bg-background px-3 text-sm"
                />
                <Button variant="outline" className="min-h-11 shrink-0" onClick={() => copy(d.share_url)}>
                  <Copy aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">{t('refer.copy')}</span>
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  render={
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  nativeButton={false}
                  className="min-h-11 bg-[#1f8f4e] text-white hover:bg-[#1a7a43]"
                >
                  {t('refer.whatsapp')}
                </Button>
                <Button variant="outline" className="min-h-11" onClick={share}>
                  <Share2 aria-hidden="true" /> {t('refer.share')}
                </Button>
              </div>

              <h2 className="mt-6 text-lg font-medium">{t('refer.how.title')}</h2>
              <ol className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                {(['refer.how.1', 'refer.how.2', 'refer.how.3'] as const).map((k, i) => (
                  <li key={k} className="flex gap-2 rounded-xl bg-background/70 p-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {f.number(i + 1)}
                    </span>
                    <span>{t(k, { amount })}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section aria-labelledby="friends-heading" className="rounded-2xl border bg-card p-5">
            <h2 id="friends-heading" className="flex items-center gap-2 text-xl">
              <UsersRound className="size-5 text-primary" aria-hidden="true" />
              {t('refer.friends.title')}
            </h2>
            {d.referrals.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t('refer.friends.empty')}</p>
            ) : (
              <ul className="mt-3 divide-y">
                {d.referrals.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-medium">{r.friend_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('refer.friends.joined', { date: f.date(r.joined_at, { day: 'numeric', month: 'short', year: 'numeric' }) })}
                      </p>
                    </div>
                    <span className={cn('rounded-full px-3 py-1 text-sm font-medium', STATUS_TONE[r.status])}>
                      {t(`refer.status.${r.status}`)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="coupons-heading" className="rounded-2xl border bg-card p-5">
            <h2 id="coupons-heading" className="flex items-center gap-2 text-xl">
              <TicketPercent className="size-5 text-primary" aria-hidden="true" />
              {t('refer.coupons.title')}
            </h2>
            {d.coupons.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t('refer.coupons.empty')}</p>
            ) : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {d.coupons.map((c) => (
                  <CouponTile key={c.code} c={c} />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}

function CouponTile({ c }: { c: MyCoupon }) {
  const t = useT('growth');
  const f = useFormat();
  const off =
    c.discount_type === 'flat'
      ? t('refer.coupons.off', { amount: f.inr(c.value / 100) })
      : t('refer.coupons.percentOff', { value: c.value });
  return (
    <li
      className={cn(
        'rounded-xl border border-dashed p-4',
        c.status === 'available' ? 'border-diya/60 bg-diya/5' : 'opacity-70',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-semibold tracking-wider">{c.code}</span>
        <span className="text-sm font-medium">{t(`refer.coupons.status.${c.status}`)}</span>
      </div>
      <p className="mt-1 text-lg font-semibold">{off}</p>
      <p className="text-sm text-muted-foreground">
        {[
          c.first_booking_only ? t('refer.coupons.firstOnly') : null,
          c.valid_to
            ? t('refer.coupons.validTill', { date: f.date(c.valid_to, { day: 'numeric', month: 'short', year: 'numeric' }) })
            : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
    </li>
  );
}
