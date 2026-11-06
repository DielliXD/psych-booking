"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { clearLanguageSwitch, readLanguageSwitch, usePendingLanguageSwitch } from "@/lib/langSwitch";

// useLayoutEffect on the client (runs before paint), plain useEffect during SSR
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;


// Layout by width:
//   < 640px   : logo · theme · menu button                (Book lives in the menu)
//   640–1279  : logo · theme · Book · menu button
//   ≥ 1280px  : logo · links · language · theme · Book    (no menu button)
// The full nav only appears at xl: 5 links + controls overflowed a 768px
// tablet and wrapped onto two lines at 1024px. Nothing in the bar may wrap.
export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  // After a language switch from the drawer, this Header is a fresh mount:
  // start with the drawer already open and without a slide-in.
  const pending = usePendingLanguageSwitch();
  const [open, setOpen] = useState(pending === "menu");
  const [instant, setInstant] = useState(pending === "menu");
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Full labels in the mobile menu; the desktop bar uses short ones and skips
  // Home (the logo already links there).
  const links = [
    { href: `/${locale}`, label: t("home"), short: "" },
    { href: `/${locale}/about`, label: t("about"), short: t("about") },
    { href: `/${locale}/services`, label: t("services"), short: t("services") },
    { href: `/${locale}/faq`, label: t("faq"), short: t("faqShort") },
    { href: `/${locale}/contact`, label: t("contact"), short: t("contact") },
    { href: `/${locale}/dashboard`, label: t("mySessions"), short: t("mySessions") },
  ];
  const isActive = (href: string) => (href === `/${locale}` ? pathname === href : !!pathname?.startsWith(href));

  const closeMenu = useCallback(() => {
    setOpen(false);
    menuButtonRef.current?.focus({ preventScroll: true });
  }, []);

  // ---- Finishing a language switch ----
  // Runs before the browser paints the new language:
  //   1. hide page text (body[data-lang-switch], CSS in globals.css),
  //   2. two frames later reveal it → it fades in,
  //   3. if the switch came from the drawer, the drawer simply STAYS OPEN in
  //      the new language — the visitor closes it when they're ready.
  // The note is only cleared once everything has finished, so React running
  // effects twice in development (Strict Mode) can't cut the sequence short.
  useIsoLayoutEffect(() => {
    const source = readLanguageSwitch();
    if (!source) return;
    document.body.dataset.langSwitch = "1";
    if (source === "menu") setOpen(true);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        delete document.body.dataset.langSwitch;
        setInstant(false);
      });
    });
    const timer = window.setTimeout(clearLanguageSwitch, 600);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(timer);
    };
  }, [locale]);

  // Close the drawer when going to another PAGE (a language change keeps the
  // same page, so it doesn't count), and if the window grows to desktop width
  // (e.g. rotating a tablet) where the full nav takes over.
  const pageKey = pathname?.split("/").slice(2).join("/") ?? "";
  const lastPageKey = useRef(pageKey);
  useEffect(() => {
    if (lastPageKey.current === pageKey) return; // first render / same page in another language
    lastPageKey.current = pageKey;
    setOpen(false);
  }, [pageKey]);
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 1280px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-linen/85 dark:bg-night/85 backdrop-blur-md border-b border-line/70 dark:border-mist/10 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto px-page flex max-w-7xl items-center justify-between gap-3 py-3">
        <Link href={`/${locale}`} className="flex min-h-[44px] shrink-0 items-center gap-2.5 rounded-full" aria-label={t("brand")}>
          <Logo />
          <span data-lang-fade className="whitespace-nowrap font-display text-[1.35rem] font-semibold tracking-tight text-ink dark:text-mist">{t("brand")}</span>
        </Link>

        <nav data-lang-fade aria-label={t("mainNav")} className="hidden xl:flex items-center gap-1 text-[0.95rem]">
          {links.filter((link) => link.short).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full px-3 transition-colors duration-200 ${
                isActive(link.href)
                  ? "text-pine dark:text-apricot font-medium"
                  : "text-stone hover:text-pine dark:text-haze dark:hover:text-apricot"
              }`}
            >
              {link.short}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden xl:block">
            <LanguageSwitcher />
          </div>
          <ThemeToggle />
          <Link
            href={`/${locale}/book`}
            className="hidden sm:inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full bg-pine px-5 text-sm font-semibold text-white shadow-soft transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-lifted dark:bg-apricot dark:text-ink"
          >
            <span data-lang-fade>{t("bookShort")}</span>
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-haspopup="dialog"
            aria-label={t("openMenu")}
            className="xl:hidden inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-pine dark:border-mist/20 dark:text-mist dark:hover:border-apricot"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      <MobileMenu
        open={open}
        instant={instant}
        onClose={closeMenu}
        links={links}
        isActive={isActive}
      />
    </header>
  );
}
