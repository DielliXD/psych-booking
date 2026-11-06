import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Compass } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("notFound");
  return { title: t("title") };
}

export default async function NotFound() {
  const [t, locale] = await Promise.all([getTranslations("notFound"), getLocale()]);
  return (
    <div className="mx-auto max-w-xl px-page py-16 text-center sm:py-28">
      <div className="mx-auto mb-7 grid h-16 w-16 place-items-center rounded-full bg-mint text-pine dark:bg-mist/10 dark:text-apricot">
        <Compass size={28} aria-hidden="true" />
      </div>
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-clay dark:text-apricot">404</p>
      <h1 className="mb-4 text-display-md font-semibold">{t("title")}</h1>
      <p className="mb-9 text-lg leading-relaxed text-stone dark:text-haze">{t("text")}</p>
      <div className="flex flex-col justify-center gap-3 xs:flex-row">
        <Link
          href={`/${locale}`}
          className="inline-flex min-h-[50px] items-center justify-center rounded-full border border-line px-6 font-semibold text-pine hover:border-pine dark:border-mist/20 dark:text-apricot"
        >
          {t("home")}
        </Link>
        <Link
          href={`/${locale}/book`}
          className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-pine px-6 font-semibold text-white hover:bg-pineDark dark:bg-apricot dark:text-ink"
        >
          {t("book")}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
