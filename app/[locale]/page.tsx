import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, ChevronDown, Globe2, Languages, Mail, MessageCircle, ShieldCheck, Video } from "lucide-react";
import { BreathingFigure } from "@/components/home/BreathingFigure";
import { NextSlots } from "@/components/home/NextSlots";
import { getPrices } from "@/lib/prices";

// Path under /public once Filloreta has a portrait (e.g. "/images/filloreta.jpg").
// Until then a calm monogram card stands in — never a "[photo]" placeholder.
const PORTRAIT_SRC: string | null = null;

const FAQ_KEYS = ["q1", "q3", "q4", "q7"] as const;

// Prices on the home page come from the admin; re-read at most once a minute.
export const revalidate = 60;

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  // Static rendering with next-intl
  setRequestLocale(locale);
  const [t, tServices, tFaq, prices] = await Promise.all([
    getTranslations("home"),
    getTranslations("services"),
    getTranslations("faqPage"),
    getPrices(),
  ]);

  const steps = [
    { title: t("step1Title"), text: t("step1Text") },
    { title: t("step2Title"), text: t("step2Text") },
    { title: t("step3Title"), text: t("step3Text") },
  ];
  const formats = [
    { icon: Video, title: tServices("formatVideo"), text: tServices("formatVideoText") },
    { icon: MessageCircle, title: tServices("formatChat"), text: tServices("formatChatText") },
    { icon: Mail, title: tServices("formatAsync"), text: tServices("formatAsyncText") },
  ];
  // Topics she works with — confirm the list with Filloreta.
  const topics = t("topics").split("|");

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden bg-night text-mist">
        <div className="mx-auto px-page grid max-w-6xl items-center gap-8 pb-16 pt-8 sm:gap-10 sm:pb-20 sm:pt-14 md:grid-cols-[1.15fr_0.85fr] md:gap-12 lg:gap-16 lg:py-24 short:py-10">
          <div className="order-2 md:order-1">
            <p className="mb-5 inline-flex items-center gap-2.5 text-[0.8rem] font-semibold uppercase tracking-widest text-apricot sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-apricot" aria-hidden="true" />
              {t("heroEyebrow")}
            </p>
            <h1 className="mb-6 max-w-xl text-display-xl font-semibold">{t("heroTitle")}</h1>
            <p className="mb-9 max-w-lg text-lg leading-relaxed text-haze sm:text-xl">{t("heroSubtitle")}</p>
            <div className="flex flex-col gap-3 xs:flex-row xs:flex-wrap">
              <Link
                href={`/${locale}/book`}
                className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-apricot px-7 text-[1.05rem] font-semibold text-ink shadow-lifted transition-transform duration-300 ease-smooth hover:-translate-y-0.5"
              >
                {t("heroCta")}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a
                href="#how"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-mist/30 px-7 text-[1.05rem] font-medium text-mist transition-colors hover:border-apricot hover:text-apricot"
              >
                {t("heroSecondary")}
              </a>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[0.95rem] text-haze">
              <li className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-apricot" aria-hidden="true" />
                {t("trustConfidential")}
              </li>
              <li className="flex items-center gap-2">
                <Globe2 size={18} className="text-apricot" aria-hidden="true" />
                {t("trustOnline")}
              </li>
              <li className="flex items-center gap-2">
                <Languages size={18} className="text-apricot" aria-hidden="true" />
                {t("trustLanguages")}
              </li>
            </ul>
          </div>

          <div className="order-1 mx-auto w-[min(46vw,11rem)] xs:w-[min(46vw,13rem)] sm:w-[16rem] md:order-2 md:w-full short:max-w-[11rem] short:self-start">
            <BreathingFigure inhaleLabel={t("breatheIn")} exhaleLabel={t("breatheOut")} ariaLabel={t("figureLabel")} />
          </div>
        </div>
      </section>

      {/* ───────── Topics ───────── */}
      <section className="mx-auto px-page max-w-6xl pb-6 pt-16 sm:pt-24">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-12 gap-y-4 sm:mb-10">
          <h2 className="max-w-xl text-display-lg font-semibold">{t("topicsTitle")}</h2>
          <p className="max-w-md text-[1.05rem] leading-relaxed text-stone dark:text-haze">{t("topicsText")}</p>
        </div>
        <ul className="flex flex-wrap gap-2.5">
          {topics.map((topic) => (
            <li
              key={topic}
              className="rounded-full border border-line bg-white px-4 py-2.5 text-[0.95rem] font-medium sm:px-5 sm:py-3 dark:border-mist/10 dark:bg-mist/[0.04]"
            >
              {topic}
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── About teaser ───────── */}
      <section className="mx-auto px-page max-w-6xl py-14 sm:py-20">
        <div className="grid items-center gap-8 rounded-[2rem] border border-line bg-white p-5 sm:p-10 md:grid-cols-[0.8fr_1.2fr] md:gap-12 lg:p-14 dark:border-mist/10 dark:bg-mist/[0.03]">
          <div className="relative mx-auto aspect-square w-full max-w-[13rem] overflow-hidden sm:max-w-[16rem] md:aspect-[4/5] md:max-w-sm rounded-3xl bg-mint dark:bg-mist/10">
            {PORTRAIT_SRC ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={PORTRAIT_SRC} alt="Filloreta Bokshi" className="h-full w-full object-cover" />
            ) : (
              <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
                <span className="absolute aspect-square w-[70%] rounded-full border border-pine/15 dark:border-mist/15" />
                <span className="absolute aspect-square w-[48%] rounded-full border border-pine/20 dark:border-mist/20" />
                <span className="grid aspect-square w-[32%] place-items-center rounded-full bg-apricot font-display text-3xl font-semibold text-ink">
                  FB
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-clay dark:text-apricot">{t("aboutEyebrow")}</p>
            <h2 className="mb-5 text-display-lg font-semibold">{t("aboutTitle")}</h2>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-ink/80 dark:text-mist/85">{t("aboutText")}</p>
            <Link
              href={`/${locale}/about`}
              className="group inline-flex min-h-[48px] items-center gap-2 rounded-full border border-line px-6 font-semibold text-pine transition-colors hover:border-pine dark:border-mist/20 dark:text-apricot dark:hover:border-apricot"
            >
              {t("aboutCta")}
              <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── How it works + live times ───────── */}
      <section id="how" className="mx-auto px-page max-w-6xl py-14 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="mb-8 text-display-lg font-semibold sm:mb-10">{t("howTitle")}</h2>
            <ol className="relative">
              {steps.map((step, i) => (
                <li key={step.title} className="relative flex gap-5 pb-8 last:pb-0">
                  {i < steps.length - 1 && (
                    <span aria-hidden="true" className="absolute left-[21px] top-12 h-[calc(100%-3rem)] w-px bg-line dark:bg-mist/15" />
                  )}
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-display font-semibold ${
                      i === steps.length - 1 ? "bg-apricot text-ink" : "bg-pine text-white dark:bg-mist/15 dark:text-mist"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="pt-1.5">
                    <h3 className="mb-1 text-lg font-semibold">{step.title}</h3>
                    <p className="leading-relaxed text-stone dark:text-haze">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <NextSlots
            locale={locale}
            labels={{
              title: t("slotsTitle"),
              timezone: t("slotsTimezone"),
              more: t("slotsMore", { count: "{count}" }),
              loading: t("slotsLoading"),
              empty: t("slotsEmpty"),
              error: t("slotsError"),
              cta: t("slotsCta"),
            }}
          />
        </div>
      </section>

      {/* ───────── Formats + prices ───────── */}
      <section className="mx-auto px-page max-w-6xl py-14 sm:py-20">
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

        {(prices.individual || prices.couples) && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              { label: tServices("individualTitle"), price: prices.individual, dark: true },
              { label: tServices("couplesTitle"), price: prices.couples, dark: false },
            ]
              .filter((p) => p.price)
              .map((p) => (
                <div
                  key={p.label}
                  className={`flex flex-wrap items-end justify-between gap-5 rounded-3xl p-6 sm:p-8 ${
                    p.dark ? "bg-mint/60 dark:bg-mist/[0.07] dark:ring-1 dark:ring-inset dark:ring-mist/10 dark:text-mist" : "border border-line bg-white dark:border-mist/10 dark:bg-mist/[0.03]"
                  }`}
                >
                  <div>
                    <p className="mb-1 text-stone dark:text-haze">
                      {p.label} · {t("perSession")}
                    </p>
                    <p className="font-display text-4xl font-semibold tracking-tight">{p.price}</p>
                  </div>
                  <Link
                    href={`/${locale}/book`}
                    className="inline-flex min-h-[48px] items-center rounded-full bg-pine px-6 font-semibold text-white dark:bg-apricot dark:text-ink"
                  >
                    {t("bookThis")}
                  </Link>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="mx-auto px-page max-w-3xl py-14 sm:py-20">
        <h2 className="mb-8 text-center text-display-lg font-semibold sm:mb-10">{t("faqTitle")}</h2>
        <div className="flex flex-col gap-3">
          {FAQ_KEYS.map((key) => (
            <details
              key={key}
              className="group rounded-2xl border border-line bg-white open:shadow-soft dark:border-mist/10 dark:bg-mist/[0.03]"
            >
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[1.05rem] font-semibold sm:px-6 [&::-webkit-details-marker]:hidden">
                {tFaq(`${key}q`)}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-linen text-pine transition-transform duration-300 group-open:rotate-180 group-open:bg-apricot group-open:text-ink dark:bg-mist/10 dark:text-apricot">
                  <ChevronDown size={18} aria-hidden="true" />
                </span>
              </summary>
              <p className="px-5 pb-5 leading-relaxed text-stone sm:px-6 dark:text-haze">{tFaq(`${key}a`)}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link href={`/${locale}/faq`} className="inline-flex min-h-[44px] items-center gap-2 font-semibold text-pine underline-offset-4 hover:underline dark:text-apricot">
            {t("faqMore")}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </p>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="mx-auto px-page max-w-6xl pb-6 pt-6 sm:pt-10">
        <div className="relative overflow-hidden rounded-[2rem] bg-night dark:bg-mist/[0.07] dark:ring-1 dark:ring-inset dark:ring-mist/10 px-5 py-12 text-mist xs:px-6 sm:px-12 sm:py-16 lg:px-16">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(240,162,123,0.5),rgba(240,162,123,0)_70%)] animate-breathe"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="mb-3 text-display-lg font-semibold">{t("finalCtaTitle")}</h2>
              <p className="text-lg leading-relaxed text-haze">{t("finalCtaText")}</p>
            </div>
            <Link
              href={`/${locale}/book`}
              className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-apricot px-4 text-base font-semibold text-ink xs:gap-2.5 xs:px-8 xs:text-lg xs:w-auto"
            >
              {t("finalCtaButton")}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-xl text-center text-[0.95rem] leading-relaxed text-stone dark:text-haze">
          {t.rich("crisis", { b: (chunks) => <strong className="text-ink dark:text-mist">{chunks}</strong> })}
        </p>
      </section>
    </>
  );
}
