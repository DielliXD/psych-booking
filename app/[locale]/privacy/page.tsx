import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("legalPage");
  return (
    <section className="max-w-2xl mx-auto px-6 lg:px-8 py-24">
      <h1 className="text-3xl mb-6 text-ink dark:text-mist tracking-tightest">{t("privacyTitle")}</h1>
      <p className="text-sm leading-relaxed text-ink/55 dark:text-mist/55">{t("placeholder")}</p>
    </section>
  );
}
