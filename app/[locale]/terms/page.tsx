import { getTranslations } from "next-intl/server";
import { LegalDocument } from "@/components/LegalDocument";
import { formatLongDate } from "@/lib/timezone";
import { LAST_UPDATED, legalContent } from "@/content/legal";

export default async function TermsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations("legalPage");
  const doc = legalContent.terms[locale === "en" ? "en" : "sq"];
  const date = formatLongDate(LAST_UPDATED, locale);
  return <LegalDocument title={t("termsTitle")} updatedLabel={t("lastUpdated", { date })} doc={doc} />;
}
