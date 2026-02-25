import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}",
    "./types/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        shell: "#fbf7f1",
        ink: "#141312",
        muted: "#6f6a62",
        gold: "#c7a46b",
      },
      borderRadius: {
        brand: "18px",
        panel: "24px",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(20,19,18,0.06)",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      letterSpacing: {
        editorial: "-0.02em",
        label: "0.14em",
      },
    },
  },
  plugins: []
};

export default config;
