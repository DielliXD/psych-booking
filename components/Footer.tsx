"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-pine/10 dark:border-sage/10 mt-32">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-5 text-sm text-ink/55 dark:text-mist/55">
        <p className="tracking-wide">&copy; {year} · {t("rights")}</p>
        <div className="flex gap-8">
          <Link href={`/${locale}/privacy`} className="hover:text-pine dark:hover:text-sage transition-colors duration-200">
            {t("privacy")}
          </Link>
          <Link href={`/${locale}/terms`} className="hover:text-pine dark:hover:text-sage transition-colors duration-200">
            {t("terms")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
