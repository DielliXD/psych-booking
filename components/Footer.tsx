"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Logo } from "./Logo";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const year = new Date().getFullYear();

  const links = [
    { href: `/${locale}/privacy`, label: t("privacy") },
    { href: `/${locale}/terms`, label: t("terms") },
    { href: `/${locale}/contact`, label: tNav("contact") },
  ];

  return (
    <footer className="mt-24 border-t border-line dark:border-mist/10 sm:mt-32">
      <div className="mx-auto px-page flex max-w-6xl flex-col gap-6 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-sm text-stone dark:text-haze md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Logo size={30} />
          <p>
            &copy; {year} {t("owner")} · {t("rights")}
          </p>
        </div>
        <nav aria-label={t("legalNav")} className="flex flex-wrap gap-x-6 gap-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-[44px] items-center transition-colors duration-200 hover:text-pine dark:hover:text-apricot"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
