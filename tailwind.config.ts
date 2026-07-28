import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141F1A",       // near-black pine, backgrounds/text
        pine: "#1F3A31",      // primary brand green (greenstone)
        pineLight: "#33584C",
        paper: "#F2EEE3",     // warm paper background
        sand: "#E7DFC9",      // secondary surface
        gold: "#C99A3C",      // accent - route markers, prices, CTAs
        goldMuted: "#DCC58C",
        line: "#D8CEB4",      // hairline / borders on paper
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
      },
      backgroundImage: {
        "route-dash": "repeating-linear-gradient(90deg, currentColor 0 6px, transparent 6px 14px)",
      },
    },
  },
  plugins: [],
};

export default config;
