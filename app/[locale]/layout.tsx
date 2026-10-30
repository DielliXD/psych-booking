import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Fraunces, Karla } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { locales } from "@/i18n/config";
import "../globals.css";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"], // latin-ext covers Albanian diacritics (ë, ç)
  variable: "--font-fraunces",
  display: "swap",
});

const karla = Karla({
  subsets: ["latin", "latin-ext"],
  variable: "--font-karla",
  display: "swap",
});

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
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${fraunces.variable} ${karla.variable}`} suppressHydrationWarning>
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
