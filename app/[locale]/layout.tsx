import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata, Viewport } from "next";
import { bricolage, figtree } from "@/app/fonts";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { locales } from "@/i18n/config";
import "../globals.css";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { default: t("title"), template: `%s · ${t("brand")}` },
    description: t("description"),
    applicationName: t("brand"),
    openGraph: { title: t("title"), description: t("description"), siteName: t("brand"), locale, type: "website" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets content use the full screen on notched phones (paired with safe-area padding)
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F6F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0E2629" },
  ],
};

const CLIENT_NAMESPACES = ["nav", "footer", "theme", "language", "booking", "manage", "contactPage", "login"];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  // Lets every page under this layout render statically (next-intl)
  setRequestLocale(locale);
  const all = await getMessages();
  // Only the namespaces that client components use are sent to the browser;
  // server-rendered pages (home, about, services, FAQ, legal, dashboard)
  // translate on the server and don't need theirs in the bundle.
  const messages = Object.fromEntries(CLIENT_NAMESPACES.filter((ns) => ns in all).map((ns) => [ns, all[ns]]));

  return (
    <html lang={locale} className={`${bricolage.variable} ${figtree.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <Header />
            <main className="min-h-[70vh]">{children}</main>
            <Footer />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
