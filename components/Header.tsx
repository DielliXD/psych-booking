"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();

  const links = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/about`, label: t("about") },
    { href: `/${locale}/services`, label: t("services") },
    { href: `/${locale}/contact`, label: t("contact") },
    { href: `/${locale}/login`, label: t("mySessions") },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-linen/80 dark:bg-charcoalGreen/80 shadow-soft">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 lg:px-8 py-4">
        <Link href={`/${locale}`} className="group flex items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-pine dark:bg-sage transition-transform duration-300 group-hover:scale-105">
            <svg width="14" height="14" viewBox="0 0 100 100" fill="none">
              <path
                d="M20 50 Q 35 20, 50 50 T 80 50"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                className="text-linen dark:text-charcoalGreen"
              />
            </svg>
          </span>
          <span className="font-display text-lg tracking-tight text-pine dark:text-sage">
            mendja e qetë
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[0.9rem]">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative py-1 text-ink/65 hover:text-pine dark:text-mist/65 dark:hover:text-sage transition-colors duration-200 after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-0 after:bg-pine dark:after:bg-sage after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href={`/${locale}/book`}
            className="hidden sm:inline-flex items-center rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen px-5 py-2.5 text-sm font-medium shadow-soft hover:shadow-lifted hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-smooth"
          >
            {t("book")}
          </Link>
        </div>
      </div>
    </header>
  );
}
