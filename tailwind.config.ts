import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

// "Frymë" design system for Shprehu / Tell Me.
//
// The original token NAMES are kept (linen, pine, clay, ink, charcoalGreen,
// mist, sage) so every existing page picks up the new look at once; their
// VALUES are the new palette. New names (night, apricot, mint, teal, stone)
// are for the redesigned components.
// All text/background pairs used in the app meet WCAG AA (4.5:1).
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    // Declared here (not under extend) so `xs` sorts BEFORE sm/md/lg in the
    // generated CSS — under extend it was appended last and `xs:` silently
    // overrode `md:`/`lg:` classes. `short` stays last on purpose.
    screens: {
      xs: "400px", // small phones vs. regular phones
      ...defaultTheme.screens,
      short: { raw: "(max-height: 500px)" }, // landscape phones
    },
    extend: {
      colors: {
        // ---- Light mode ----
        linen: "#F4F6F5", // page background — cool off-white
        pine: "#135C57", // primary — deep teal (white text: 7.6:1)
        pineDark: "#0C3F3B",
        clay: "#A3532F", // warm accent for TEXT on light (5.4:1 on white)
        ink: "#13201E", // body text
        stone: "#4A5A57", // muted text (6.7:1 on linen)
        line: "#DCE5E2", // hairlines / borders
        mint: "#DCEBE7", // soft teal tint for chips and icon wells
        // ---- Dark / hero ----
        night: "#0E2629", // hero + dark-mode background
        charcoalGreen: "#0E2629", // (old name) dark-mode background
        mist: "#F1F4F2", // text on dark
        haze: "#A9BDB9", // muted text on dark (8:1 on night)
        apricot: "#F0A27B", // signature accent — fills, CTAs, the breathing orb
        sage: "#F0A27B", // (old name) dark-mode accent → apricot
        teal: "#135C57",
      },
      fontFamily: {
        display: ["var(--font-bricolage)", "system-ui", "sans-serif"],
        body: ["var(--font-figtree)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Fluid display sizes: scale smoothly from 320px phones to wide screens
        "display-xl": ["clamp(2.5rem, 1.6rem + 4.2vw, 4.75rem)", { lineHeight: "1.02", letterSpacing: "-0.035em" }],
        "display-lg": ["clamp(2rem, 1.5rem + 2.4vw, 3rem)", { lineHeight: "1.08", letterSpacing: "-0.03em" }],
        "display-md": ["clamp(1.6rem, 1.3rem + 1.4vw, 2.25rem)", { lineHeight: "1.12", letterSpacing: "-0.025em" }],
      },
      borderRadius: {
        organic: "60% 40% 55% 45% / 45% 55% 40% 60%",
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgba(14,38,41,0.08), 0 1px 2px -1px rgba(14,38,41,0.06)",
        card: "0 4px 20px -4px rgba(14,38,41,0.10), 0 2px 6px -2px rgba(14,38,41,0.06)",
        lifted: "0 18px 40px -18px rgba(14,38,41,0.35)",
        glow: "0 0 0 4px rgba(240,162,123,0.25)",
        orb: "0 0 120px 10px rgba(240,162,123,0.28)",
      },
      letterSpacing: {
        tightest: "-0.035em",
        wide: "0.08em",
        widest: "0.14em",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // The breathing orb: 4s in, 4s out
        breathe: {
          "0%, 100%": { transform: "scale(0.68)" },
          "50%": { transform: "scale(1)" },
        },
        ripple: {
          "0%": { transform: "scale(0.7)", opacity: "0.55" },
          "100%": { transform: "scale(1.55)", opacity: "0" },
        },
        sayIn: {
          "0%, 42%": { opacity: "1" },
          "50%, 92%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        sayOut: {
          "0%, 42%": { opacity: "0" },
          "50%, 92%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        breathe: "breathe 8s ease-in-out infinite",
        ripple: "ripple 8s ease-out infinite",
        sayIn: "sayIn 8s ease-in-out infinite",
        sayOut: "sayOut 8s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
