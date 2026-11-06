import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Check, Clock, Globe2, Languages, Mail, MessageCircle, ShieldCheck, User, Users, Video, X } from "lucide-react";
import { PageIntro } from "@/components/ui/PageIntro";
import { CtaBand } from "@/components/ui/CtaBand";
import { getCancellationPolicy, getPrices } from "@/lib/prices";
import { pageMetadata, type LocaleParams } from "@/lib/pageMetadata";

// Prices and the cancellation policy come from the admin settings.
export const revalidate = 60;

export const generateMetadata = ({ params: { locale } }: LocaleParams) => pageMetadata(locale, { title: "nav.services", description: "services.lead" });

export default async function ServicesPage({ params: { locale } }: { params: { locale: string } }) {
  // Static rendering with next-intl
  setRequestLocale(locale);
  const [t, prices, policy] = await Promise.all([getTranslations("services"), getPrices(), getCancellationPolicy()]);

  const sessions = [
    { icon: User, title: t("individualTitle"), text: t("individualText"), price: prices.individual, dark: true },
    { icon: Users, title: t("couplesTitle"), text: t("couplesText"), price: prices.couples, dark: false },
  ];
  const facts = [
    { icon: Clock, label: t("fact1") },
    { icon: Globe2, label: t("fact2") },
    { icon: Languages, label: t("fact3") },
    { icon: ShieldCheck, label: t("fact4") },
  ];
  const formats = [
    { icon: Video, title: t("formatVideo"), text: t("formatVideoText") },
    { icon: MessageCircle, title: t("formatChat"), text: t("formatChatText") },
    { icon: Mail, title: t("formatAsync"), text: t("formatAsyncText") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-page pb-6 pt-12 sm:pt-20">
      <div className="grid items-end gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
        <PageIntro eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        {/* Quick facts — fills the right side on desktop, a compact grid on phones */}
        <ul className="grid animate-fadeUp grid-cols-2 gap-3">
          {facts.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:p-5 dark:border-mist/10 dark:bg-mist/[0.03]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-pine dark:bg-mist/10 dark:text-apricot">
                <Icon size={19} aria-hidden="true" />
              </span>
              <span className="font-semibold leading-snug">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Session types */}
      <section className="mt-12 grid gap-4 sm:mt-16 md:grid-cols-2">
        {sessions.map(({ icon: Icon, title, text, price, dark }) => (
          <article
            key={title}
            className={`flex flex-col rounded-[1.75rem] p-6 sm:p-8 ${
              dark ? "bg-mint/60 dark:bg-mist/[0.07] dark:ring-1 dark:ring-inset dark:ring-mist/10 dark:text-mist" : "border border-line bg-white dark:border-mist/10 dark:bg-mist/[0.03]"
            }`}
          >
            <span
              className={`mb-6 grid h-12 w-12 place-items-center rounded-2xl ${
                dark ? "bg-white text-pine dark:bg-mist/10 dark:text-apricot" : "bg-mint text-pine dark:bg-mist/10 dark:text-apricot"
              }`}
            >
              <Icon size={22} aria-hidden="true" />
            </span>
            <h2 className="mb-3 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h2>
            <p className={`mb-8 text-[1.05rem] leading-relaxed text-stone dark:text-haze`}>{text}</p>
            <div className={`mt-auto flex flex-wrap items-end justify-between gap-4 border-t pt-5 ${dark ? "border-pine/15 dark:border-mist/10" : "border-line dark:border-mist/10"}`}>
              <div>
                {price ? (
                  <>
                    <p className="font-display text-3xl font-semibold tracking-tight">{price}</p>
                    <p className={`text-sm text-stone dark:text-haze`}>{t("perSession")}</p>
                  </>
                ) : (
                  <p className="font-display text-xl font-semibold">{t("duration")}</p>
                )}
              </div>
              <Link
                href={`/${locale}/book`}
                className={`inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 font-semibold ${
                  "bg-pine text-white dark:bg-apricot dark:text-ink"
                }`}
              >
                {t("book")}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </section>

      {/* Formats */}
      <section className="mt-20 sm:mt-28">
        <h2 className="mb-8 text-display-lg font-semibold sm:mb-10">{t("formatsTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {formats.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-4 rounded-3xl border border-line bg-white p-5 sm:block sm:p-7 dark:border-mist/10 dark:bg-mist/[0.03]">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint text-pine sm:mb-5 dark:bg-mist/10 dark:text-apricot">
                <Icon size={22} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="mb-1 text-xl font-semibold sm:mb-2">{title}</h3>
                <p className="leading-relaxed text-stone dark:text-haze">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* First session */}
      <section className="mt-20 grid items-center gap-8 rounded-[2rem] bg-mint/60 p-6 sm:mt-28 sm:p-10 md:grid-cols-[0.9fr_1.1fr] lg:p-14 dark:bg-mist/[0.05]">
        <h2 className="text-display-lg font-semibold">{t("firstSessionTitle")}</h2>
        <p className="text-lg leading-relaxed text-ink/80 dark:text-mist/85">{t("firstSessionText")}</p>
      </section>

      {/* Fit */}
      <section className="mt-20 sm:mt-28">
        <h2 className="mb-8 text-display-lg font-semibold sm:mb-10">{t("fitTitle")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-line bg-white p-6 sm:p-8 dark:border-mist/10 dark:bg-mist/[0.03]">
            <p className="mb-5 font-semibold text-pine dark:text-apricot">{t("fitGoodForTitle")}</p>
            <ul className="space-y-4">
              {(["fitGoodFor1", "fitGoodFor2", "fitGoodFor3"] as const).map((key) => (
                <li key={key} className="flex items-start gap-3 leading-relaxed">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint text-pine dark:bg-mist/10 dark:text-apricot">
                    <Check size={14} strokeWidth={3} aria-hidden="true" />
                  </span>
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-line bg-white p-6 sm:p-8 dark:border-mist/10 dark:bg-mist/[0.03]">
            <p className="mb-5 font-semibold text-clay dark:text-apricot">{t("fitNotForTitle")}</p>
            <ul className="space-y-4">
              {(["fitNotFor1", "fitNotFor2"] as const).map((key) => (
                <li key={key} className="flex items-start gap-3 leading-relaxed">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-clay/10 text-clay dark:bg-apricot/15 dark:text-apricot">
                    <X size={14} strokeWidth={3} aria-hidden="true" />
                  </span>
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Rescheduling & cancelling: the policy on the left, how-to on the right */}
      <section className="mt-20 grid gap-8 sm:mt-28 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="mb-4 text-display-lg font-semibold">{t("cancellationTitle")}</h2>
          <p className="whitespace-pre-line text-lg leading-relaxed text-ink/80 dark:text-mist/85">{policy ?? t("cancellationText")}</p>
          <p className="mt-3 text-stone dark:text-haze">{t("durationNote")}</p>
        </div>
        <ol className="rounded-3xl border border-line bg-white p-5 sm:p-7 dark:border-mist/10 dark:bg-mist/[0.03]">
          {(["howTo1", "howTo2", "howTo3"] as const).map((key, i, arr) => (
            <li key={key} className="relative flex gap-4 pb-6 last:pb-0">
              {i < arr.length - 1 && (
                <span aria-hidden="true" className="absolute left-[19px] top-11 h-[calc(100%-2.75rem)] w-px bg-line dark:bg-mist/15" />
              )}
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-display font-semibold ${
                  i === arr.length - 1 ? "bg-apricot text-ink" : "bg-pine text-white dark:bg-mist/15 dark:text-mist"
                }`}
              >
                {i + 1}
              </span>
              <p className="pt-2 leading-relaxed">{t(key)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-20 sm:mt-28">
        <CtaBand title={t("ctaTitle")} text={t("ctaText")} href={`/${locale}/book`} button={t("book")} />
      </section>
    </div>
  );
}
