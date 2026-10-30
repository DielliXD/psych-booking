import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export const config = {
  // Match all paths except static files, API routes, admin, and Next internals
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
