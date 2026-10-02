'use client';

import { useT } from '@/i18n';
import { DiyaLoader } from '@/components/common/loading';

/** DiyaLoader with a translated default label. */
export function AuthLoader({ label }: { label?: string }) {
  const t = useT('common');
  return <DiyaLoader label={label ?? t('state.loading')} />;
}
