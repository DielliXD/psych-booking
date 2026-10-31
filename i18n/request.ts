import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "./config";

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) notFound();

  return {
    locale: locale as string, // next-intl 3.22+ expects the locale back
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
