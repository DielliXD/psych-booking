import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

// Per-page <title> and description. The layout's template turns the title
// into "Rreth Meje · Shprehu" / "About · Tell Me".
//
// title / description are "namespace.key" paths in messages/*.json.
// noindex: private pages (booking links, dashboard, login) stay out of search.
export async function pageMetadata(
  locale: string,
  { title, description, noindex = false }: { title: string; description?: string; noindex?: boolean },
): Promise<Metadata> {
  const t = await getTranslations({ locale });
  const brand = t("meta.brand");
  const pageTitle = t(title);
  const desc = description ? t(description) : t("meta.description");
  return {
    title: pageTitle,
    description: desc,
    // Replaces the layout's openGraph, so it repeats the shared fields
    openGraph: { title: `${pageTitle} · ${brand}`, description: desc, siteName: brand, locale, type: "website" },
    ...(noindex && { robots: { index: false, follow: false } }),
  };
}

export type LocaleParams = { params: { locale: string } };
