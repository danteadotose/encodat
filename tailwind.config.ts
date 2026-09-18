import type { Config } from "tailwindcss";
/* Los valores coinciden con los tokens de app/globals.css. Todos los pares
   texto/fondo usados en la interfaz están verificados a WCAG AA (≥4.5:1 en
   texto, ≥3:1 en marcas de datos y bordes que portan información). */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF9F5",
        surface: "#FFFFFF",
        ink: "#15211F",
        subink: "#4A574F",
        faint: "#5D6A62",
        line: "#DDE3DC",
        teal: { wash: "#EAF2F0", soft: "#8DBFB7", DEFAULT: "#0B5A52", deep: "#084741", ink: "#062F2B" },
        amber: { DEFAULT: "#9A4E11", soft: "#B87333", wash: "#FBF1E3", ink: "#7A3D06" },
        indigo: { DEFAULT: "#2E4A7D" },
      },
      fontFamily: {
        display: ["\"Iowan Old Style\"", "\"Palatino Linotype\"", "Palatino", "Georgia", "Cambria", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "\"Segoe UI\"", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      maxWidth: { measure: "68ch" },
      boxShadow: {
        card: "0 1px 2px rgba(21,33,31,.05)",
        lift: "0 8px 24px -10px rgba(8,71,65,.22), 0 2px 6px rgba(21,33,31,.05)",
      },
      letterSpacing: { kicker: "0.12em" },
    },
  },
  plugins: [],
};
export default config;
