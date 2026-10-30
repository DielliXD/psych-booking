import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Light mode
        linen: "#EFF2ED",      // background — pale sage-white, not cream
        pine: "#2F4F44",       // primary accent — deep forest/pine green, trust + calm
        pineDark: "#233B33",
        clay: "#C08974",       // secondary accent — dusty rose-clay, warm & human
        ink: "#23302B",        // body text
        // Dark mode
        charcoalGreen: "#14201C", // background
        mist: "#DCE3DE",          // dark-mode text
        sage: "#8FA998",          // dark-mode muted accent
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-karla)", "sans-serif"],
      },
      borderRadius: {
        organic: "60% 40% 55% 45% / 45% 55% 40% 60%",
        "4xl": "2rem",
      },
      boxShadow: {
        // warm-tinted shadows (pine-tinted, not generic gray) — reads as intentional, not default
        soft: "0 2px 8px -2px rgba(47,79,68,0.08), 0 1px 2px -1px rgba(47,79,68,0.06)",
        card: "0 4px 20px -4px rgba(47,79,68,0.10), 0 2px 6px -2px rgba(47,79,68,0.06)",
        lifted: "0 12px 32px -8px rgba(47,79,68,0.18), 0 4px 12px -4px rgba(47,79,68,0.10)",
        glow: "0 0 0 4px rgba(192,137,116,0.12)",
      },
      letterSpacing: {
        tightest: "-0.04em",
        wide: "0.08em",
        widest: "0.16em",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};
export default config;
