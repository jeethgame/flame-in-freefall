import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    borderRadius: {
      none: "0",
      sm: "1px",
      DEFAULT: "0",
      full: "9999px",
    },
    extend: {
      colors: {
        aero: {
          bg: "#06090F",
          surface: "#0B101B",
          card: "#0C1119",
          border: "#1e293b",
          cyan: "#06B6D4",
          amber: "#F59E0B",
          red: "#EF4444",
          green: "#22C55E",
          muted: "#475569",
          label: "#64748B",
          text: "#94A3B8",
          bright: "#CBD5E1",
          value: "#E2E8F0",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Satoshi", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
