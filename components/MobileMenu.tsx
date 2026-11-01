"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, X } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useIsClient } from "@/lib/langSwitch";
import { Logo } from "./Logo";

interface MenuLink {
  href: string;
  label: string;
}

// Short screens (landscape phones, ≤500px tall) get a denser layout via the
// `short:` variant so all links fit without scrolling where possible.
//
// Side drawer for phones and tablets. Slides in from the right over a dimmed,
// blurred page. Closes on: the ✕ button, tapping the backdrop, Escape, or
// picking a link. While open it traps keyboard focus and locks page scroll.
//
// Rendered through a portal into <body>: the sticky header uses
// backdrop-filter, which would otherwise trap position:fixed children inside
// the header's box.
// Motion: iOS-style easing (fast start, long gentle settle). Both directions
// are unhurried; closing eases out with a softer curve so it glides away
// instead of snapping shut.
// Only transform + opacity are animated (GPU-friendly); the backdrop has no
// blur because animating over backdrop-filter stutters on iPhones.
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const EASE_CLOSE = "cubic-bezier(0.4, 0, 0.2, 1)";
const OPEN_MS = 480;
const CLOSE_MS = 440;

export function MobileMenu({
  open,
  instant = false,
  onClose,
  links,
  isActive,
}: {
  open: boolean;
  /** Render in the current state with no transition (used right after a language switch reload). */
  instant?: boolean;
  onClose: () => void;
  links: MenuLink[];
  isActive: (href: string) => boolean;
}) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Available on the very first render after a client-side remount (no
  // blank frame when the page re-renders in another language).
  const mounted = useIsClient();

  useEffect(() => {
    if (!open) return;
    // Lock page scroll. On tablets/desktop browsers with a visible scrollbar,
    // pad the body by the scrollbar's width so the page doesn't jump sideways.
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    // Focus the close button once the slide-in has started
    const focusTimer = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), instant ? 0 : 120);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      // Keep Tab inside the drawer
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, instant]);

  if (!mounted) return null;

  return createPortal(
    <div className="xl:hidden" aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-night/50 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        style={{
          transition: instant ? "none" : open ? `opacity ${OPEN_MS}ms ${EASE}` : `opacity ${CLOSE_MS}ms ${EASE_CLOSE}`,
        }}
      />

      {/* Drawer */}
      <div
        id="mobile-menu"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("mainNav")}
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(86vw,22rem)] flex-col bg-linen shadow-2xl will-change-transform dark:bg-night ${
          open ? "visible translate-x-0" : "invisible translate-x-full"
        }`}
        style={{
          transition: instant
            ? "none"
            : open
              ? `transform ${OPEN_MS}ms ${EASE}, visibility 0s linear 0ms`
              : `transform ${CLOSE_MS}ms ${EASE_CLOSE}, visibility 0s linear ${CLOSE_MS}ms`,
          paddingTop: "env(safe-area-inset-top)",
          paddingRight: "env(safe-area-inset-right)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line/70 px-5 py-3 short:py-1.5 dark:border-mist/10">
          <span className="flex items-center gap-2.5">
            <Logo size={32} />
            <span data-lang-fade className="font-display text-xl font-semibold tracking-tight">{t("brand")}</span>
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("closeMenu")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-pine dark:border-mist/20 dark:text-mist dark:hover:border-apricot"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 short:py-2">
          <ul data-lang-fade className="flex flex-col gap-1">
            {links.map((link, i) => {
              const active = isActive(link.href);
              return (
                <li
                  key={link.href}
                  className={open ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0"}
                  style={{
                    // Links drift in one after another while the panel settles
                    transition: instant
                      ? "none"
                      : open
                        ? `opacity 380ms ${EASE}, transform ${OPEN_MS}ms ${EASE}`
                        : `opacity 220ms ${EASE_CLOSE}, transform ${CLOSE_MS}ms ${EASE_CLOSE}`,
                    transitionDelay: open && !instant ? `${110 + i * 35}ms` : "0ms",
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={`group flex min-h-[52px] items-center justify-between rounded-2xl px-4 font-display text-[1.35rem] tracking-tight transition-colors short:min-h-[44px] short:text-lg ${
                      active
                        ? "bg-mint text-pineDark dark:bg-mist/10 dark:text-apricot"
                        : "text-ink hover:bg-pine/[0.06] dark:text-mist dark:hover:bg-mist/[0.06]"
                    }`}
                  >
                    {link.label}
                    <ArrowRight
                      size={18}
                      aria-hidden="true"
                      className={`transition-transform group-hover:translate-x-1 ${active ? "opacity-100" : "opacity-30"}`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex flex-col gap-3 border-t border-line/70 px-5 pt-4 pb-5 short:grid short:grid-cols-2 short:items-center short:gap-3 short:py-2.5 dark:border-mist/10">
          <div className="short:flex-1">
            <LanguageSwitcher size="lg" />
          </div>
          <Link
            href={`/${locale}/book`}
            onClick={onClose}
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-pine px-6 text-base font-semibold text-white shadow-soft transition-transform active:scale-[0.98] short:h-12 short:flex-1 short:px-4 short:text-[0.95rem] dark:bg-apricot dark:text-ink"
          >
            <span data-lang-fade className="whitespace-nowrap short:hidden">{t("book")}</span>
            <span data-lang-fade className="hidden whitespace-nowrap short:inline">{t("bookShort")}</span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
