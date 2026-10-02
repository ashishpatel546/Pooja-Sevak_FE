import { INTL_LOCALE, type Locale } from './config';
import type { Messages, Namespace } from './messages';

export type Vars = Record<string, string | number>;

/** Keys like 'x_one' / 'x_other' expose the plural base 'x'. */
export type PluralBase<K> = K extends `${infer B}_one` ? B : never;

export type Translator<N extends Namespace> = {
  (key: keyof Messages[N] & string, vars?: Vars): string;
  /** Picks `${base}_one` / `${base}_other` with Intl.PluralRules; {count} is available. */
  plural: (base: PluralBase<keyof Messages[N]>, count: number, vars?: Vars) => string;
};

export type LoadedMessages = { [N in Namespace]: Record<string, string> };

function interpolate(text: string, vars?: Vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in vars ? String(vars[name]) : m,
  );
}

export function createTranslator<N extends Namespace>(
  locale: Locale,
  messages: LoadedMessages,
  ns: N,
): Translator<N> {
  const dict = messages[ns] ?? {};
  const rules = new Intl.PluralRules(INTL_LOCALE[locale]);
  const t = ((key: string, vars?: Vars) => {
    const text = dict[key];
    if (text === undefined) {
      if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] missing ${locale}:${ns}.${key}`);
      return key;
    }
    return interpolate(text, vars);
  }) as unknown as Translator<N>;
  t.plural = (base, count, vars) => {
    const form = rules.select(count) === 'one' ? 'one' : 'other';
    return t(`${String(base)}_${form}` as keyof Messages[N] & string, { count, ...vars });
  };
  return t;
}

/**
 * Picks a localized field from API data: `pick(def, 'name', 'hi')` returns
 * def.name_hi when present, else def.name.
 */
export function pick<T extends object, F extends keyof T & string>(
  obj: T,
  field: F,
  locale: Locale,
): T[F] {
  if (locale === 'hi') {
    const hiValue = (obj as Record<string, unknown>)[`${field}_hi`];
    if (hiValue !== undefined && hiValue !== null && hiValue !== '') return hiValue as T[F];
  }
  return obj[field];
}
