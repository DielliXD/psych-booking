import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ShieldCheck, GraduationCap, Ban } from "lucide-react";

export default async function HomePage() {
  const t = await getTranslations("home");
  const locale = await getLocale();

  const steps = [
    { title: t("step1Title"), text: t("step1Text") },
    { title: t("step2Title"), text: t("step2Text") },
    { title: t("step3Title"), text: t("step3Text") },
  ];

  const trustPoints = [
    { icon: ShieldCheck, title: t("trust1Title"), text: t("trust1Text") },
    { icon: GraduationCap, title: t("trust2Title"), text: t("trust2Text") },
    { icon: Ban, title: t("trust3Title"), text: t("trust3Text") },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-24 pb-32 grid md:grid-cols-2 gap-16 items-center">
          <div className="animate-fadeUp">
            <span className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-clay mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-clay" />
              Terapi &middot; Individuale &amp; Çifte
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.08] tracking-tightest text-ink dark:text-mist mb-7 max-w-lg">
              {t("heroTitle")}
            </h1>
            <p className="text-lg leading-relaxed text-ink/65 dark:text-mist/65 mb-10 max-w-md">
              {t("heroSubtitle")}
            </p>
            <Link
              href={`/${locale}/book`}
              className="inline-flex items-center gap-2 rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen px-7 py-3.5 font-medium shadow-soft hover:shadow-lifted hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-smooth"
            >
              {t("heroCta")}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <div className="relative h-80 md:h-[26rem] flex items-center justify-center" aria-hidden="true">
            <div className="absolute w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-clay/25 to-clay/5 dark:from-sage/15 dark:to-sage/5 rounded-organic blur-sm animate-fadeUp" />
            <div className="absolute w-44 h-44 md:w-56 md:h-56 bg-gradient-to-tr from-pine/20 to-pine/5 dark:from-pine/35 dark:to-pine/10 rounded-organic" />
            <div className="absolute w-24 h-24 rounded-full bg-linen dark:bg-charcoalGreen shadow-lifted flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
                <path
                  d="M15 50 Q 30 22, 50 50 T 85 50"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="text-pine dark:text-sage"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 pb-28">
        <div className="max-w-xl mb-16">
          <h2 className="text-3xl mb-4 text-ink dark:text-mist tracking-tightest">{t("introTitle")}</h2>
          <p className="text-ink/60 dark:text-mist/60 leading-relaxed">{t("introText")}</p>
        </div>

        <ol className="grid sm:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="group relative rounded-3xl border border-pine/10 dark:border-sage/10 bg-white/40 dark:bg-white/[0.02] p-7 shadow-soft hover:shadow-card transition-shadow duration-300"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-pine/8 dark:bg-sage/10 font-display text-sm text-pine dark:text-sage mb-5">
                {i + 1}
              </span>
              <h3 className="text-lg mb-2.5 text-ink dark:text-mist">{step.title}</h3>
              <p className="text-sm leading-relaxed text-ink/55 dark:text-mist/55">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Trust / why choose */}
      <section className="bg-pine/[0.03] dark:bg-sage/[0.03] py-28">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="max-w-xl mb-16">
            <h2 className="text-3xl mb-4 text-ink dark:text-mist tracking-tightest">{t("trustTitle")}</h2>
            <p className="text-ink/60 dark:text-mist/60 leading-relaxed">{t("trustText")}</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {trustPoints.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl bg-white/50 dark:bg-white/[0.02] p-7 shadow-soft">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-pine/8 dark:bg-sage/10 mb-5">
                  <Icon className="text-pine dark:text-sage" size={20} strokeWidth={1.75} />
                </div>
                <h3 className="text-base mb-2 text-ink dark:text-mist">{title}</h3>
                <p className="text-sm leading-relaxed text-ink/55 dark:text-mist/55">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-3xl mx-auto px-6 lg:px-8 py-28 text-center">
        <p className="text-xs font-medium tracking-widest uppercase text-clay mb-8">{t("testimonialTitle")}</p>
        <blockquote className="font-display text-2xl sm:text-3xl leading-snug text-ink dark:text-mist mb-6 italic">
          &ldquo;{t("testimonialQuote")}&rdquo;
        </blockquote>
        <p className="text-sm text-ink/45 dark:text-mist/45">{t("testimonialAttribution")}</p>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 lg:px-8 pb-32 text-center">
        <div className="rounded-4xl bg-pine dark:bg-sage text-linen dark:text-charcoalGreen px-8 py-16 shadow-card">
          <h2 className="text-3xl mb-3 tracking-tightest">{t("finalCtaTitle")}</h2>
          <p className="opacity-80 mb-9 max-w-md mx-auto">{t("finalCtaText")}</p>
          <Link
            href={`/${locale}/book`}
            className="inline-flex items-center gap-2 rounded-full bg-linen text-pine dark:bg-charcoalGreen dark:text-sage px-7 py-3.5 font-medium shadow-soft hover:shadow-lifted hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-smooth"
          >
            {t("finalCtaButton")}
          </Link>
        </div>
      </section>
    </>
  );
}
