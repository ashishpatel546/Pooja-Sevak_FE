'use client';

import { useT } from '@/i18n';
import { rich } from '@/components/common/rich';

function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const t = useT('auth');
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline underline-offset-4 hover:no-underline"
    >
      {children}
      <span className="sr-only"> {t('consent.newTab')}</span>
    </a>
  );
}

/** Required "I agree to the Terms of Service and Privacy Policy" checkbox for signup. */
export function TermsConsent({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | null;
}) {
  const t = useT('auth');
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-3">
        <input
          id="accept-terms"
          type="checkbox"
          required
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? 'accept-terms-error' : undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary"
        />
        <label htmlFor="accept-terms" className="cursor-pointer text-sm leading-relaxed">
          {rich(t('consent.agree'), {
            terms: <LegalLink href="/terms">{t('consent.terms')}</LegalLink>,
            privacy: <LegalLink href="/privacy">{t('consent.privacy')}</LegalLink>,
          })}
        </label>
      </div>
      {error && (
        <p id="accept-terms-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Small print under "Continue with Google": using it accepts the Terms and Privacy Policy. */
export function GoogleConsentNote() {
  const t = useT('auth');
  return (
    <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
      {rich(t('google.consent'), {
        terms: <LegalLink href="/terms">{t('google.consentTerms')}</LegalLink>,
        privacy: <LegalLink href="/privacy">{t('google.consentPrivacy')}</LegalLink>,
      })}
    </p>
  );
}
