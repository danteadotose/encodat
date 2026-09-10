import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F8F6",
        surface: "#FFFFFF",
        ink: "#1A1813",
        subink: "#57564E",
        faint: "#666D68",
        line: "#DCE3DD",
        teal: { wash: "#E3F0EF", soft: "#6FABAF", DEFAULT: "#137A80", deep: "#0C4F53", ink: "#093B3E" },
        amber: { DEFAULT: "#B4611F", soft: "#E4A66A" },
        indigo: { DEFAULT: "#33517E" },
      },
      fontFamily: {
        display: ["\"Iowan Old Style\"", "\"Palatino Linotype\"", "Palatino", "Georgia", "Cambria", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "\"Segoe UI\"", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      maxWidth: { measure: "62ch" },
      boxShadow: {
        card: "0 1px 2px rgba(26,24,19,.04), 0 1px 1px rgba(26,24,19,.03)",
        lift: "0 6px 24px -8px rgba(12,79,83,.18), 0 2px 6px rgba(26,24,19,.05)",
      },
      letterSpacing: { kicker: "0.14em" },
    },
  },
  plugins: [],
};
export default config;
