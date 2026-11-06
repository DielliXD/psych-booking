import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalDocument } from "@/components/LegalDocument";
import { formatLongDate } from "@/lib/timezone";
import { LAST_UPDATED, legalContent } from "@/content/legal";
import { pageMetadata, type LocaleParams } from "@/lib/pageMetadata";

export const generateMetadata = ({ params: { locale } }: LocaleParams) => pageMetadata(locale, { title: "legalPage.termsTitle" });

export default async function TermsPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("legalPage");
  const doc = legalContent.terms[locale === "en" ? "en" : "sq"];
  const date = formatLongDate(LAST_UPDATED, locale);
  return <LegalDocument title={t("termsTitle")} updatedLabel={t("lastUpdated", { date })} doc={doc} />;
}
