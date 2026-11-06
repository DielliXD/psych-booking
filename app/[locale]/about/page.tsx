import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeartHandshake, Languages, Lock, Timer } from "lucide-react";
import { PageIntro } from "@/components/ui/PageIntro";
import { CtaBand } from "@/components/ui/CtaBand";
import { pageMetadata, type LocaleParams } from "@/lib/pageMetadata";

// Path under /public once Filloreta has a portrait (e.g. "/images/filloreta.jpg").
// Until then a calm monogram card stands in — never a "[photo]" placeholder.
const PORTRAIT_SRC: string | null = null;

// Her real qualifications, one per line, e.g.
//   "Master në Psikologji Klinike — Universiteti i Prishtinës"
// The section stays hidden while this is empty, so nothing invented ever shows.
const CREDENTIALS: { sq: string; en: string }[] = [];

export const generateMetadata = ({ params: { locale } }: LocaleParams) => pageMetadata(locale, { title: "nav.about" });

export default async function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  // Static rendering with next-intl
  setRequestLocale(locale);
  const [t, tHome] = await Promise.all([getTranslations("about"), getTranslations("home")]);
  const topics = tHome("topics").split("|");
  const values = [
    { icon: HeartHandshake, title: t("value1Title"), text: t("value1Text") },
    { icon: Lock, title: t("value2Title"), text: t("value2Text") },
    { icon: Timer, title: t("value3Title"), text: t("value3Text") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-page pb-6 pt-12 sm:pt-20">
      <div className="grid items-center gap-10 md:grid-cols-[1.15fr_0.85fr] md:gap-14">
        <PageIntro eyebrow={t("eyebrow")} title={t("title")} lead={t("introText")} />
        <div className="relative mx-auto aspect-square w-full max-w-[16rem] overflow-hidden rounded-[2rem] bg-mint sm:max-w-[20rem] md:aspect-[4/5] md:max-w-sm dark:bg-mist/10">
          {PORTRAIT_SRC ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={PORTRAIT_SRC} alt="Filloreta Bokshi" className="h-full w-full object-cover" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
              <span className="absolute aspect-square w-[72%] rounded-full border border-pine/15 dark:border-mist/15" />
              <span className="absolute aspect-square w-[50%] animate-breathe rounded-full border border-pine/20 dark:border-mist/20" />
              <span className="grid aspect-square w-[32%] place-items-center rounded-full bg-apricot font-display text-3xl font-semibold text-ink sm:text-4xl">
                FB
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Approach */}
      <section className="mt-20 grid gap-10 sm:mt-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <h2 className="mb-5 text-display-lg font-semibold">{t("approachTitle")}</h2>
          <p className="text-lg leading-relaxed text-ink/80 dark:text-mist/85">{t("approachText")}</p>
        </div>
        <ul className="grid gap-4">
          {values.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-4 rounded-3xl border border-line bg-white p-5 sm:p-6 dark:border-mist/10 dark:bg-mist/[0.03]">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint text-pine dark:bg-mist/10 dark:text-apricot">
                <Icon size={22} aria-hidden="true" />
              </span>
              <div>
                <h3 className="mb-1 text-lg font-semibold">{title}</h3>
                <p className="leading-relaxed text-stone dark:text-haze">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Topics */}
      <section className="mt-20 sm:mt-28">
        <h2 className="mb-8 text-display-lg font-semibold">{t("topicsTitle")}</h2>
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

      {/* Languages + qualifications */}
      <section className={`mt-20 grid gap-4 sm:mt-28 ${CREDENTIALS.length ? "md:grid-cols-2" : ""}`}>
        <div className="flex items-start gap-4 rounded-3xl bg-mint/60 dark:bg-mist/[0.07] dark:ring-1 dark:ring-inset dark:ring-mist/10 p-6 sm:p-8 dark:text-mist">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-pine dark:bg-mist/10 dark:text-apricot">
            <Languages size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="mb-1 text-xl font-semibold">{t("languagesTitle")}</h2>
            <p className="text-lg leading-relaxed text-stone dark:text-haze">{t("languagesText")}</p>
          </div>
        </div>
        {CREDENTIALS.length > 0 && (
          <div className="rounded-3xl border border-line bg-white p-6 sm:p-8 dark:border-mist/10 dark:bg-mist/[0.03]">
            <h2 className="mb-4 text-xl font-semibold">{t("credentialsTitle")}</h2>
            <ul className="space-y-3">
              {CREDENTIALS.map((c) => (
                <li key={c.en} className="flex items-start gap-3 leading-relaxed">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-apricot" aria-hidden="true" />
                  {locale === "en" ? c.en : c.sq}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-20 sm:mt-28">
        <CtaBand title={t("ctaTitle")} text={t("ctaText")} href={`/${locale}/book`} button={t("ctaButton")} />
      </section>
    </div>
  );
}
