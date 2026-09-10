import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/Chrome";

export const metadata: Metadata = {
  title: "ENCODAT 2025 · Explorador de resultados",
  description: "Explorador interactivo y estadísticamente riguroso de la Encuesta Nacional de Consumo de Drogas, Alcohol y Tabaco (ENCODAT) 2025.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        <SiteHeader />
        <main id="contenido">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
