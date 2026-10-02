'use client';

import type { ServiceDefinition } from '@/lib/types';
import { pick, useLocale, useT } from '@/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** Puja filter. `value` null means all pujas. */
export function ServiceSelect({
  services,
  value,
  onChange,
  onlineOnly = false,
  id,
}: {
  services: ServiceDefinition[];
  value: string | null;
  onChange: (id: string | null) => void;
  onlineOnly?: boolean;
  id?: string;
}) {
  const t = useT('customer');
  const { locale } = useLocale();
  const list = services.filter((s) => s.is_active !== false && (!onlineOnly || s.supports_online));
  const items: Record<string, string> = { all: t('service.all') };
  list.forEach((s) => (items[s.id] = pick(s, 'name', locale)));
  const current = value && items[value] ? value : 'all';
  return (
    <Select
      items={items}
      value={current}
      onValueChange={(v) => onChange(!v || v === 'all' ? null : String(v))}
    >
      <SelectTrigger id={id} className="w-full sm:w-72" aria-label={t('service.filter')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{items.all}</SelectItem>
        {list.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {items[s.id]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
