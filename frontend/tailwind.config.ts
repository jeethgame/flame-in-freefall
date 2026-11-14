import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        space: {
          bg: "#000000",
          surface: "#0A0F1C",
          card: "#0E1525",
          border: "#1a2744",
          cyan: "#00E5FF",
          amber: "#FFB300",
          crimson: "#FF1744",
          muted: "#4A5578",
          text: "#C8D6F0",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
