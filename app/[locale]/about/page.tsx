import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <section className="max-w-5xl mx-auto px-page py-14 sm:py-24">
      <div className="grid md:grid-cols-[1fr_1.3fr] gap-16 items-start mb-24">
        <div className="relative aspect-[4/5] rounded-4xl bg-gradient-to-br from-pine/15 to-clay/10 dark:from-sage/15 dark:to-clay/10 shadow-card flex items-center justify-center">
          <p className="text-xs text-ink/35 dark:text-mist/35 px-6 text-center">
            [Replace with her real photo]
          </p>
        </div>

        <div>
          <h1 className="text-4xl mb-5 text-ink dark:text-mist tracking-tightest">{t("title")}</h1>
          <p className="text-lg leading-relaxed text-ink/65 dark:text-mist/65 mb-10 max-w-lg">
            {t("introText")}
          </p>

          <div>
            <h2 className="text-xs font-medium tracking-widest uppercase text-clay mb-4">
              {t("credentialsTitle")}
            </h2>
            <ul className="space-y-3 text-sm text-ink/70 dark:text-mist/70">
              {[
                "M.Sc. in Clinical Psychology — [University name]",
                "Licensed Psychologist, [Licensing body], [Year]",
                "[X] years in private practice",
                "Specializations: [e.g. anxiety, couples, trauma]",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-1 w-1 rounded-full bg-clay shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mb-24">
        <h2 className="text-2xl mb-5 text-ink dark:text-mist tracking-tightest">{t("storyTitle")}</h2>
        <p className="text-sm leading-relaxed text-ink/60 dark:text-mist/60 italic">{t("storyText")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-x-16 gap-y-14">
        <div>
          <h2 className="text-2xl mb-4 text-ink dark:text-mist tracking-tightest">{t("approachTitle")}</h2>
          <p className="text-sm leading-relaxed text-ink/70 dark:text-mist/70">
            [Write a short paragraph here about her therapeutic philosophy — e.g. person-centered,
            CBT-informed, collaborative, culturally attuned — in her own voice.]
          </p>
        </div>

        <div>
          <h2 className="text-2xl mb-4 text-ink dark:text-mist tracking-tightest">{t("modalitiesTitle")}</h2>
          <p className="text-sm leading-relaxed text-ink/70 dark:text-mist/70">{t("modalitiesText")}</p>
        </div>

        <div>
          <h2 className="text-2xl mb-4 text-ink dark:text-mist tracking-tightest">{t("whoIWorkWithTitle")}</h2>
          <p className="text-sm leading-relaxed text-ink/70 dark:text-mist/70">{t("whoIWorkWithText")}</p>
        </div>

        <div>
          <h2 className="text-2xl mb-4 text-ink dark:text-mist tracking-tightest">{t("languagesTitle")}</h2>
          <p className="text-sm leading-relaxed text-ink/70 dark:text-mist/70">{t("languagesText")}</p>
        </div>
      </div>
    </section>
  );
}
