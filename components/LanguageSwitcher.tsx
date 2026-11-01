"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { clearLanguageSwitch, markLanguageSwitch } from "@/lib/langSwitch";

// Segmented control with a sliding "thumb".
//
// Tapping a language first slides the thumb across (so the tap feels
// answered immediately), THEN navigates to the same page in that language.
//
// size "md": compact SQ / EN pill for the desktop header (40px)
// size "lg": full-width control for the mobile drawer — 52px tall, 48px on
//            short landscape screens, always the same height as the Book
//            button beside/below it so the two read as a pair.
const SLIDE_MS = 300; // thumb slide
const FADE_OUT_AT = 120; // start fading page text while the thumb is moving
const SAFETY_MS = 4000; // never leave the page faded if navigation fails

export function LanguageSwitcher({ size = "md" }: { size?: "md" | "lg" }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeLocale = useLocale() as Locale;
  const t = useTranslations("language");

  // What the thumb shows. Moves instantly on tap; snaps back to the real
  // locale if it changes some other way (back button, etc.).
  const [shown, setShown] = useState<Locale>(activeLocale);
  useEffect(() => setShown(activeLocale), [activeLocale]);

  const lg = size === "lg";

  function switchTo(locale: Locale) {
    if (locale === shown) return;
    setShown(locale);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const go = () => {
      // "lg" lives in the mobile drawer → keep the drawer open across the switch
      markLanguageSwitch(lg ? "menu" : "page");
      const segments = pathname.split("/");
      segments[1] = locale;
      router.push(segments.join("/") + window.location.search + window.location.hash, { scroll: false });
    };
    if (reduceMotion) return go();
    window.setTimeout(() => (document.body.dataset.langSwitch = "1"), FADE_OUT_AT);
    window.setTimeout(go, SLIDE_MS + 40);
    window.setTimeout(() => {
      delete document.body.dataset.langSwitch;
      clearLanguageSwitch();
    }, SAFETY_MS);
  }

  const index = locales.indexOf(shown);

  return (
    <div
      role="group"
      aria-label={t("switch")}
      className={`relative grid grid-cols-2 rounded-full bg-pine/[0.07] p-1 dark:bg-mist/[0.08] ${
        lg ? "h-[52px] w-full short:h-12" : "h-10 w-[6.5rem]"
      }`}
    >
      {/* Sliding thumb */}
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-pine shadow-soft transition-transform duration-300 ease-smooth will-change-transform dark:bg-apricot"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {locales.map((locale) => {
        const selected = locale === shown;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            onClick={() => switchTo(locale)}
            aria-pressed={selected}
            aria-label={localeNames[locale]}
            className={`relative z-10 flex h-full items-center justify-center rounded-full font-medium transition-colors duration-300 ${
              lg ? "text-base short:text-[0.95rem]" : "text-sm"
            } ${selected ? "text-white dark:text-ink" : "text-stone hover:text-ink dark:text-haze dark:hover:text-mist"}`}
          >
            {lg ? localeNames[locale] : locale.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
