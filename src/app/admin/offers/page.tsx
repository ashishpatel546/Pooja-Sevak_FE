'use client';

import { useState } from 'react';
import { CircleAlert, Pencil, Plus, TicketPercent } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AdminCoupon, AdminCouponList } from '@/lib/types';
import { useFormat, useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { errorMessage, useApi } from '@/components/dashboard/use-api';
import { cn } from '@/lib/utils';
import { CouponDialog } from './coupon-dialog';

export default function AdminOffersPage() {
  const { token } = useAuth();
  const t = useT('growth');
  const tc = useT('common');
  const f = useFormat();
  const list = useApi<AdminCouponList>('/admin/coupons', token);
  const [editing, setEditing] = useState<AdminCoupon | 'new' | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const upsert = (c: AdminCoupon) =>
    list.mutate((l) => {
      if (!l) return l;
      const exists = l.coupons.some((x) => x.id === c.id);
      return {
        ...l,
        coupons: exists ? l.coupons.map((x) => (x.id === c.id ? { ...x, ...c } : x)) : [c, ...l.coupons],
      };
    });

  const toggle = async (c: AdminCoupon) => {
    setBusy(c.id);
    try {
      const saved = await api<AdminCoupon>(`/admin/coupons/${c.id}`, {
        method: 'PUT',
        token,
        body: { is_active: !c.is_active },
      });
      upsert({ ...c, ...saved });
      list.reload();
      toast.success(t('admin.saved', { code: c.code }));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const day = (iso: string) => f.date(iso, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const discountText = (c: AdminCoupon) =>
    c.discount_type === 'flat'
      ? f.inr(c.value / 100)
      : `${c.value}%${c.max_discount_paise ? ` (≤ ${f.inr(c.max_discount_paise / 100)})` : ''}`;
  const windowText = (c: AdminCoupon) =>
    !c.valid_from && !c.valid_to
      ? t('admin.always')
      : [c.valid_from && t('admin.from', { date: day(c.valid_from) }), c.valid_to && t('admin.to', { date: day(c.valid_to) })]
          .filter(Boolean)
          .join(' ');
  const status = (c: AdminCoupon) =>
    !c.is_active ? 'inactive' : c.live ? 'live' : 'scheduled';

  return (
    <>
      <PageHeader
        title={t('admin.title')}
        description={t('admin.desc')}
        actions={
          <Button onClick={() => setEditing('new')} className="min-h-11">
            <Plus aria-hidden="true" /> {t('admin.new')}
          </Button>
        }
      />
      {list.loading && !list.data ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : list.error && !list.data ? (
        <EmptyState icon={CircleAlert} title={t('admin.loadError')} action={<Button onClick={list.reload}>{tc('action.retry')}</Button>}>
          {list.error}
        </EmptyState>
      ) : !list.data?.coupons.length ? (
        <EmptyState icon={TicketPercent} title={t('admin.empty.title')}>
          {t('admin.empty.body')}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{t('admin.col.code')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.col.discount')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.col.window')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('admin.col.uses')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('admin.col.given')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.col.status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.data.coupons.map((c) => {
                const s = status(c);
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold">{c.code}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t(`admin.kind.${c.kind}`)}
                        {c.festival_label ? ` · ${c.festival_label}` : ''}
                        {c.first_booking_only ? ` · ${t('admin.field.firstOnly')}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{discountText(c)}</td>
                    <td className="px-4 py-3">{windowText(c)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.uses}
                      {c.usage_limit_total ? ` / ${c.usage_limit_total}` : ''}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{f.inr(c.discount_given_paise / 100)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-medium',
                          s === 'live' ? 'bg-tulsi/15 text-tulsi' : s === 'scheduled' ? 'bg-accent' : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {t(`admin.status.${s}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="min-h-11" onClick={() => setEditing(c)}>
                          <Pencil aria-hidden="true" />
                          <span className="sr-only">{t('admin.edit')}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-11"
                          disabled={busy === c.id}
                          onClick={() => toggle(c)}
                        >
                          {c.is_active ? t('admin.deactivate') : t('admin.activate')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {list.data && (
        <p className="mt-3 text-sm text-muted-foreground">
          {t('admin.personal', { issued: list.data.personal.issued, used: list.data.personal.used })}
        </p>
      )}
      <CouponDialog
        open={editing !== null}
        coupon={editing === 'new' ? null : editing}
        token={token}
        onOpenChange={(o) => !o && setEditing(null)}
        onSaved={(c) => {
          upsert(c);
          list.reload();
          setEditing(null);
        }}
      />
    </>
  );
}
