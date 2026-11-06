import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, ChevronDown, LifeBuoy } from "lucide-react";
import { PageIntro } from "@/components/ui/PageIntro";
import { getPrices } from "@/lib/prices";
import { pageMetadata, type LocaleParams } from "@/lib/pageMetadata";

export const revalidate = 60;

const QUESTION_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;

export const generateMetadata = ({ params: { locale } }: LocaleParams) => pageMetadata(locale, { title: "nav.faq", description: "faqPage.lead" });

export default async function FaqPage({ params: { locale } }: { params: { locale: string } }) {
  // Static rendering with next-intl
  setRequestLocale(locale);
  const [t, prices] = await Promise.all([getTranslations("faqPage"), getPrices()]);

  // The price answer uses the real prices from the admin, or says they're coming
  const answer = (key: (typeof QUESTION_KEYS)[number]) => {
    if (key !== "q2") return t(`${key}a`);
    return prices.individual && prices.couples
      ? t("q2aPrices", { individual: prices.individual, couples: prices.couples })
      : t("q2aNoPrices");
  };

  return (
    <div className="mx-auto max-w-3xl px-page pb-6 pt-12 sm:pt-20">
      <PageIntro eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />

      {/* Native <details>: works without JavaScript and with the keyboard */}
      <div className="mt-10 flex flex-col gap-3 sm:mt-14">
        {QUESTION_KEYS.map((key, i) => (
          <details
            key={key}
            open={i === 0}
            className="group rounded-2xl border border-line bg-white open:shadow-soft dark:border-mist/10 dark:bg-mist/[0.03]"
          >
            <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[1.05rem] font-semibold sm:px-6 [&::-webkit-details-marker]:hidden">
              {t(`${key}q`)}
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-linen text-pine transition-transform duration-300 group-open:rotate-180 group-open:bg-apricot group-open:text-ink dark:bg-mist/10 dark:text-apricot">
                <ChevronDown size={18} aria-hidden="true" />
              </span>
            </summary>
            <p className="px-5 pb-5 text-[1.05rem] leading-relaxed text-stone sm:px-6 dark:text-haze">{answer(key)}</p>
          </details>
        ))}
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col rounded-3xl bg-mint/60 dark:bg-mist/[0.07] dark:ring-1 dark:ring-inset dark:ring-mist/10 p-6 sm:p-7 dark:text-mist">
          <h2 className="mb-2 text-xl font-semibold">{t("moreTitle")}</h2>
          <p className="mb-6 leading-relaxed text-stone dark:text-haze">{t("moreText")}</p>
          <Link
            href={`/${locale}/contact`}
            className="mt-auto inline-flex min-h-[48px] items-center justify-center gap-2 self-start rounded-full bg-pine px-6 font-semibold text-white dark:bg-apricot dark:text-ink"
          >
            {t("moreButton")}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="rounded-3xl border border-clay/25 bg-clay/[0.06] p-6 sm:p-7 dark:border-apricot/25 dark:bg-apricot/[0.06]">
          <LifeBuoy size={24} className="mb-3 text-clay dark:text-apricot" aria-hidden="true" />
          <h2 className="mb-2 text-xl font-semibold">{t("crisisNoteTitle")}</h2>
          <p className="leading-relaxed text-ink/80 dark:text-mist/85">{t("crisisNoteText")}</p>
        </div>
      </div>
    </div>
  );
}
