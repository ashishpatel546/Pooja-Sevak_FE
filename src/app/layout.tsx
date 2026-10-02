import type { Metadata, Viewport } from "next";
import { Mukta, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { NavBar } from "@/components/nav-bar";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt } from "@/components/install-prompt";
import { I18nProvider } from "@/i18n/provider";
import { getLocale, getT, messagesFor } from "@/i18n/server";
import { SITE_URL } from "@/lib/seo/site";

const tiro = Tiro_Devanagari_Hindi({
  variable: "--font-tiro",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "devanagari"],
  display: "swap",
});

const mukta = Mukta({
  variable: "--font-mukta",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "devanagari"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getT("nav");
  const tc = await getT("common");
  const brand = tc("brand.name");
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${brand}` },
    description,
    applicationName: brand,
    // Canonical and hreflang are per page (see publicMetadata in src/lib/seo):
    // a layout-level canonical would be inherited by every page. Social images
    // come from app/opengraph-image.tsx and app/twitter-image.tsx.
    openGraph: {
      type: "website",
      siteName: brand,
      title,
      description,
      locale: locale === "hi" ? "hi_IN" : "en_IN",
      alternateLocale: locale === "hi" ? ["en_IN"] : ["hi_IN"],
    },
    twitter: { card: "summary_large_image", title, description },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffaf3" },
    { media: "(prefers-color-scheme: dark)", color: "#140f24" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const t = await getT("common");
  return (
    // translate="no": the app has its own हिन्दी/English switch. Browser machine
    // translation (Chrome's Google Translate) rewrites text nodes behind React's
    // back, which shows English and crashes updates with a removeChild error.
    <html
      lang={locale}
      translate="no"
      suppressHydrationWarning
      className={`${tiro.variable} ${mukta.variable} h-full antialiased`}
    >
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          {t("skipToContent")}
        </a>
        <I18nProvider locale={locale} messages={messagesFor(locale)}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <NavBar />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </AuthProvider>
          <Toaster position="top-center" richColors />
          <InstallPrompt />
        </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
