import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/Chrome";

export const metadata: Metadata = {
  title: "ENCODAT · Informe interactivo de resultados",
  description: "Informe interactivo de la Encuesta Nacional de Consumo de Drogas, Alcohol y Tabaco (ENCODAT): estimaciones ponderadas, intervalos de confianza, alcance regional y procedencia de cada definición.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        <SiteHeader />
        <main id="contenido" tabIndex={-1}>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
