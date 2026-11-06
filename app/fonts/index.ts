import localFont from "next/font/local";

// Self-hosted variable fonts (from @fontsource-variable, OFL licence).
// Served from our own domain: no request to Google at build or page load,
// and the browser can start downloading them with the first HTML response.
// The "latin" subset already includes the Albanian letters ë and ç.

export const bricolage = localFont({
  src: "./bricolage.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
  // Headlines: match the fallback's metrics so the swap doesn't shift layout
  adjustFontFallback: "Arial",
});

export const figtree = localFont({
  src: "./figtree.woff2",
  variable: "--font-figtree",
  weight: "300 900",
  display: "swap",
  adjustFontFallback: "Arial",
});
