import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141F1A",       // near-black pine, backgrounds/text
        pine: "#1F3A31",      // primary brand green (greenstone)
        pineLight: "#33584C",
        pineDark: "#0C1512",  // deepest pine — hero overlays, footer, glass panels
        paper: "#F2EEE3",     // warm paper background
        sand: "#E7DFC9",      // secondary surface
        stone: "#EAE3D2",     // tertiary surface, between paper and sand
        gold: "#C99A3C",      // accent - route markers, prices, CTAs
        goldMuted: "#DCC58C",
        goldDeep: "#A87A2A",  // higher-contrast gold for text on paper
        line: "#D8CEB4",      // hairline / borders on paper
        lineDark: "rgba(242,238,227,0.16)", // hairline on dark/pine surfaces
        clay: "#7A4A32",      // rare secondary accent (used sparingly)
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "14px",
        xl: "22px",
      },
      backgroundImage: {
        "route-dash": "repeating-linear-gradient(90deg, currentColor 0 6px, transparent 6px 14px)",
        "route-dash-v": "repeating-linear-gradient(180deg, currentColor 0 6px, transparent 6px 14px)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,31,26,0.04), 0 12px 28px -12px rgba(20,31,26,0.16)",
        "card-hover": "0 1px 2px rgba(20,31,26,0.05), 0 24px 48px -16px rgba(20,31,26,0.28)",
        panel: "0 24px 64px -20px rgba(12,21,18,0.55)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "draw-line": {
          "0%": { backgroundSize: "0% 1px" },
          "100%": { backgroundSize: "100% 1px" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.9s ease both",
      },
      transitionTimingFunction: {
        signature: "cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
};

export default config;
