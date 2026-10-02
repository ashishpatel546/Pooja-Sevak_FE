'use client';

import { useCallback } from 'react';
import { useT } from '@/i18n';

/** Catalog categories are stored in English; these keys give their display names. */
const CATEGORY_KEYS = {
  Sanskar: 'category.sanskar',
  'Griha & Vastu': 'category.griha',
  'Shanti & Dosh': 'category.shanti',
  'Path & Katha': 'category.path',
  Festival: 'category.festival',
  'Abhishek & Jaap': 'category.abhishek',
} as const;

/** Returns a function that shows a stored category name in the visitor's language. */
export function useCategoryLabel() {
  const t = useT('dashboard');
  return useCallback(
    (category: string | null | undefined) => {
      if (!category) return t('category.none');
      const key = CATEGORY_KEYS[category as keyof typeof CATEGORY_KEYS];
      return key ? t(key) : category;
    },
    [t],
  );
}
