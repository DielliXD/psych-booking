import Link from "next/link";
import { ArrowRight } from "lucide-react";

// The dark "next step" band used at the end of content pages.
export function CtaBand({ title, text, href, button }: { title: string; text: string; href: string; button: string }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-night dark:bg-mist/[0.07] dark:ring-1 dark:ring-inset dark:ring-mist/10 px-5 py-12 text-mist xs:px-6 sm:px-12 sm:py-14 lg:px-16">
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 h-80 w-80 animate-breathe rounded-full bg-[radial-gradient(circle,rgba(240,162,123,0.45),rgba(240,162,123,0)_70%)]"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-8">
        <div className="max-w-xl">
          <h2 className="mb-3 text-display-lg font-semibold">{title}</h2>
          <p className="text-lg leading-relaxed text-haze">{text}</p>
        </div>
        <Link
          href={href}
          className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-apricot px-4 text-base font-semibold text-ink xs:gap-2.5 xs:px-8 xs:text-lg transition-transform duration-300 ease-smooth hover:-translate-y-0.5 xs:w-auto"
        >
          {button}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
