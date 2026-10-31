import { getTranslations } from "next-intl/server";
import { LegalDocument } from "@/components/LegalDocument";
import { LAST_UPDATED, legalContent } from "@/content/legal";

export default async function TermsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations("legalPage");
  const doc = legalContent.terms[locale === "en" ? "en" : "sq"];
  const date = new Date(`${LAST_UPDATED}T12:00:00Z`).toLocaleDateString(locale === "en" ? "en-GB" : "sq-AL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return <LegalDocument title={t("termsTitle")} updatedLabel={t("lastUpdated", { date })} doc={doc} />;
}
