import { getT } from '@/i18n/server';
import { DiyaLoader } from '@/components/common/loading';

export default async function PanchangLoading() {
  const t = await getT('panchang');
  return <DiyaLoader label={t('loading')} />;
}
