"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { locales, localeNames, type Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const activeLocale = useLocale();
  const t = useTranslations("language");

  function switchTo(locale: Locale) {
    // Replace the leading /xx segment with the new locale
    const segments = pathname.split("/");
    segments[1] = locale;
    router.push(segments.join("/"));
  }

  return (
    <div className="relative inline-flex items-center gap-1 text-sm bg-pine/[0.04] dark:bg-sage/[0.06] rounded-full p-1" aria-label={t("switch")}>
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => switchTo(locale)}
          aria-current={locale === activeLocale}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            locale === activeLocale
              ? "bg-pine text-linen dark:bg-sage dark:text-charcoalGreen shadow-soft"
              : "text-ink/50 hover:text-ink dark:text-mist/50 dark:hover:text-mist"
          }`}
        >
          {localeNames[locale]}
        </button>
      ))}
    </div>
  );
}
