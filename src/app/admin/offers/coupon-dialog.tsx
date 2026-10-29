'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { AdminCoupon, CouponDiscountType, ServiceDefinition } from '@/lib/types';
import { pick, useLocale, useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/dashboard/field';
import { Switch } from '@/components/dashboard/switch';
import { errorMessage, useApi } from '@/components/dashboard/use-api';
import { selectClass } from '@/components/kundali/birth-fields';

const IST_MS = 330 * 60_000;
const CODE = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;

/** ISO instant → its IST calendar day (YYYY-MM-DD). */
const istDay = (iso: string | null) => (iso ? new Date(Date.parse(iso) + IST_MS).toISOString().slice(0, 10) : '');
const rupees = (paise: number | null) => (paise == null ? '' : String(paise / 100));
const toPaise = (v: string) => (v.trim() === '' ? null : Math.round(Number(v) * 100));
const toInt = (v: string) => (v.trim() === '' ? null : Number(v));

type Props = {
  open: boolean;
  coupon: AdminCoupon | null;
  token: string | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (c: AdminCoupon) => void;
};

export function CouponDialog(props: Props) {
  const t = useT('growth');
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{props.coupon ? t('admin.edit') : t('admin.new')}</DialogTitle>
        </DialogHeader>
        {props.open && <CouponForm key={props.coupon?.id ?? 'new'} {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function CouponForm({ coupon: c, token, onOpenChange, onSaved }: Props) {
  const t = useT('growth');
  const { locale } = useLocale();
  const defs = useApi<ServiceDefinition[]>('/service-definitions?includeInactive=true', token);
  const [code, setCode] = useState(c?.code ?? '');
  const [kind, setKind] = useState<'festival' | 'general'>(c?.kind === 'general' ? 'general' : 'festival');
  const [type, setType] = useState<CouponDiscountType>(c?.discount_type ?? 'percent');
  const [value, setValue] = useState(c ? (c.discount_type === 'flat' ? rupees(c.value) : String(c.value)) : '');
  const [maxDiscount, setMaxDiscount] = useState(rupees(c?.max_discount_paise ?? null));
  const [minOrder, setMinOrder] = useState(c?.min_order_paise ? rupees(c.min_order_paise) : '');
  const [from, setFrom] = useState(istDay(c?.valid_from ?? null));
  const [to, setTo] = useState(istDay(c?.valid_to ?? null));
  const [limitTotal, setLimitTotal] = useState(c?.usage_limit_total == null ? '' : String(c.usage_limit_total));
  const [limitUser, setLimitUser] = useState(c ? (c.usage_limit_per_user == null ? '' : String(c.usage_limit_per_user)) : '1');
  const [firstOnly, setFirstOnly] = useState(c?.first_booking_only ?? false);
  const [pujas, setPujas] = useState<string[]>(c?.service_definition_ids ?? []);
  const [label, setLabel] = useState(c?.festival_label ?? '');
  const [bannerHi, setBannerHi] = useState(c?.banner_text_hi ?? '');
  const [bannerEn, setBannerEn] = useState(c?.banner_text_en ?? '');
  const [link, setLink] = useState(c?.banner_link ?? '');
  const [active, setActive] = useState(c?.is_active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const normalized = code.trim().replace(/\s+/g, '').toUpperCase();
    if (!CODE.test(normalized)) errs.code = t('admin.err.code');
    const v = Number(value);
    if (!(v > 0)) errs.value = t('admin.err.value');
    else if (type === 'percent' && (v > 100 || !Number.isInteger(v))) errs.value = t('admin.err.percent');
    if (from && to && to < from) errs.to = t('admin.err.window');
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const body = {
      code: normalized,
      kind,
      discount_type: type,
      value: type === 'flat' ? Math.round(v * 100) : v,
      max_discount_paise: type === 'percent' ? toPaise(maxDiscount) : null,
      min_order_paise: toPaise(minOrder) ?? 0,
      valid_from: from ? `${from}T00:00:00+05:30` : null,
      valid_to: to ? `${to}T23:59:59+05:30` : null,
      usage_limit_total: toInt(limitTotal),
      usage_limit_per_user: toInt(limitUser),
      first_booking_only: firstOnly,
      service_definition_ids: pujas,
      festival_label: label.trim() || null,
      banner_text_hi: bannerHi.trim() || null,
      banner_text_en: bannerEn.trim() || null,
      banner_link: link.trim() || null,
      is_active: active,
    };
    setBusy(true);
    try {
      const saved = await api<AdminCoupon>(c ? `/admin/coupons/${c.id}` : '/admin/coupons', {
        method: c ? 'PUT' : 'POST',
        token,
        body,
      });
      toast.success(t('admin.saved', { code: saved.code }));
      onSaved({ ...(c ?? { uses: 0, discount_given_paise: 0, live: false }), ...saved });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="cp-code" label={t('admin.field.code')} hint={t('admin.field.codeHint')} error={errors.code}>
          <Input
            id="cp-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="font-mono uppercase"
            maxLength={32}
            aria-invalid={!!errors.code}
          />
        </Field>
        <Field id="cp-kind" label={t('admin.field.kind')}>
          <select id="cp-kind" className={selectClass} value={kind} onChange={(e) => setKind(e.target.value as 'festival' | 'general')}>
            <option value="festival">{t('admin.kind.festival')}</option>
            <option value="general">{t('admin.kind.general')}</option>
          </select>
        </Field>
        <Field id="cp-type" label={t('admin.field.discountType')}>
          <select id="cp-type" className={selectClass} value={type} onChange={(e) => setType(e.target.value as CouponDiscountType)}>
            <option value="percent">{t('admin.discount.percent')}</option>
            <option value="flat">{t('admin.discount.flat')}</option>
          </select>
        </Field>
        <Field
          id="cp-value"
          label={t('admin.field.value')}
          hint={type === 'percent' ? t('admin.field.valueHintPercent') : t('admin.field.valueHintFlat')}
          error={errors.value}
        >
          <Input id="cp-value" type="number" inputMode="decimal" min={1} value={value} onChange={(e) => setValue(e.target.value)} />
        </Field>
        {type === 'percent' && (
          <Field id="cp-max" label={t('admin.field.maxDiscount')} hint={t('admin.field.limitHint')}>
            <Input id="cp-max" type="number" inputMode="decimal" min={1} value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} />
          </Field>
        )}
        <Field id="cp-min" label={t('admin.field.minOrder')}>
          <Input id="cp-min" type="number" inputMode="decimal" min={0} value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
        </Field>
        <Field id="cp-from" label={t('admin.field.validFrom')}>
          <Input id="cp-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field id="cp-to" label={t('admin.field.validTo')} error={errors.to}>
          <Input id="cp-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Field id="cp-total" label={t('admin.field.limitTotal')} hint={t('admin.field.limitHint')}>
          <Input id="cp-total" type="number" inputMode="numeric" min={1} value={limitTotal} onChange={(e) => setLimitTotal(e.target.value)} />
        </Field>
        <Field id="cp-user" label={t('admin.field.limitUser')} hint={t('admin.field.limitHint')}>
          <Input id="cp-user" type="number" inputMode="numeric" min={1} value={limitUser} onChange={(e) => setLimitUser(e.target.value)} />
        </Field>
      </div>

      <label className="flex min-h-11 items-center gap-3">
        <Switch checked={firstOnly} onCheckedChange={setFirstOnly} aria-label={t('admin.field.firstOnly')} />
        <span>{t('admin.field.firstOnly')}</span>
      </label>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">{t('admin.field.pujas')}</legend>
        <p className="text-sm text-muted-foreground">{t('admin.field.pujasHint')}</p>
        <div className="grid max-h-48 gap-1 overflow-y-auto rounded-lg border p-2 sm:grid-cols-2">
          {(defs.data ?? []).map((d) => (
            <label key={d.id} className="flex min-h-9 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pujas.includes(d.id)}
                onChange={(e) => setPujas((p) => (e.target.checked ? [...p, d.id] : p.filter((x) => x !== d.id)))}
              />
              {pick(d, 'name', locale)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="cp-label" label={t('admin.field.festivalLabel')}>
          <Input id="cp-label" value={label} maxLength={100} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field id="cp-link" label={t('admin.field.bannerLink')} hint={t('admin.field.bannerLinkHint')}>
          <Input id="cp-link" value={link} maxLength={300} placeholder="/pujas/lakshmi-puja" onChange={(e) => setLink(e.target.value)} />
        </Field>
        <Field id="cp-bhi" label={t('admin.field.bannerHi')} hint={t('admin.field.bannerHint')} className="sm:col-span-2">
          <Input id="cp-bhi" lang="hi" value={bannerHi} maxLength={300} onChange={(e) => setBannerHi(e.target.value)} />
        </Field>
        <Field id="cp-ben" label={t('admin.field.bannerEn')} className="sm:col-span-2">
          <Input id="cp-ben" lang="en" value={bannerEn} maxLength={300} onChange={(e) => setBannerEn(e.target.value)} />
        </Field>
      </div>

      <label className="flex min-h-11 items-center gap-3">
        <Switch checked={active} onCheckedChange={setActive} aria-label={t('admin.field.active')} />
        <span>{t('admin.field.active')}</span>
      </label>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {t('admin.cancel')}
        </Button>
        <Button type="submit" disabled={busy}>
          {t('admin.save')}
        </Button>
      </DialogFooter>
    </form>
  );
}
