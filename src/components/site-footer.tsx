import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { getT } from '@/i18n/server';
import { LanguageLinks } from '@/components/seo/language-links';

export async function SiteFooter() {
  const t = await getT('nav');
  return (
    <footer className="sandhya relative mt-16 overflow-hidden">
      <div className="toran" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-4 py-12 sm:px-6 sm:grid-cols-3 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))]">
        <div className="col-span-2 max-w-sm sm:col-span-3 lg:col-span-1">
          <Logo onDark />
          <p className="mt-4 text-sm leading-relaxed">{t('footer.about')}</p>
          <p lang="sa" className="mt-4 font-heading text-lg leading-relaxed text-[#fbe3b6]">
            ॥ सर्वे भवन्तु सुखिनः ॥
          </p>
          <p className="text-xs text-[#f4e6d4]/60">{t('footer.blessingMeaning')}</p>
        </div>
        <FooterCol
          title={t('footer.book')}
          links={[
            ['/pujas', t('footer.allPujas')],
            ['/browse', t('footer.pandits')],
            ['/online', t('footer.online')],
            ['/panchang', t('footer.panchang')],
          ]}
        />
        <FooterCol
          title={t('footer.forPandits')}
          links={[
            ['/signup?role=pandit', t('footer.joinPandit')],
            ['/login', t('footer.panditSignIn')],
          ]}
        />
        <FooterCol
          title={t('footer.yourAccount')}
          links={[
            ['/bookings', t('footer.myBookings')],
            ['/reminders', t('footer.reminders')],
            ['/addresses', t('footer.addresses')],
            ['/dashboard', t('footer.dashboard')],
          ]}
        />
        <FooterCol
          title={t('footer.company')}
          links={[
            ['/about', t('footer.aboutUs')],
            ['/contact', t('footer.contact')],
            ['/faq', t('footer.faq')],
          ]}
        />
        <FooterCol
          title={t('footer.legal')}
          links={[
            ['/terms', t('footer.terms')],
            ['/privacy', t('footer.privacy')],
            ['/refund-policy', t('footer.refund')],
          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 pt-5 pb-2 text-xs leading-relaxed text-[#f4e6d4]/60 sm:px-6">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </p>
        <LanguageLinks className="mx-auto max-w-7xl px-4 pb-5 text-xs text-[#f4e6d4]/70 sm:px-6" />
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="font-sans text-sm font-semibold text-[#fbe3b6]">{title}</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link
              href={href}
              className="inline-flex min-h-9 items-center text-[#f4e6d4]/80 hover:text-[#fbe3b6] hover:underline"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
