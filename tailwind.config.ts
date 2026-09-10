import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#09090b",
        muted: {
          DEFAULT: "#f4f4f5",
          foreground: "#71717a",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#09090b",
        },
        border: "#e4e4e7",
        primary: {
          DEFAULT: "#18181b",
          foreground: "#fafafa",
        },
        accent: {
          DEFAULT: "#f4f4f5",
          foreground: "#18181b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
