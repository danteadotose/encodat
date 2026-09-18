"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Icon } from "./Controls";
import { usePathname } from "next/navigation";
import { DATASET_YEAR, AUDIT_DATE } from "@/lib/data";

/* Una sola ruta de comparación temporal está viva: /comparar.
   /comparacion es un alias heredado que reexporta esa misma página y no
   aparece en la navegación (ver docs/DESIGN_SYSTEM.md). */
const NAV = [
  { href: "/", label: "Informe" },
  { href: "/explorar", label: "Explorar" },
  { href: "/comparar", label: "Entre ediciones" },
  { href: "/correlaciones", label: "Asociaciones" },
  { href: "/datos", label: "Datos" },
  { href: "/metodologia", label: "Metodología" },
];

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <header className="site-header" onKeyDown={e => { if (e.key === "Escape") { setOpen(false); document.getElementById("nav-toggle")?.focus(); } }}>
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label={`ENCODAT ${DATASET_YEAR} · Informe de resultados · Inicio`}>
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>ENCODAT <strong>{DATASET_YEAR}</strong><small>Informe interactivo de resultados</small></span>
        </Link>
        <button id="nav-toggle" type="button" className="btn btn-secondary nav-toggle" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>
          <Icon name={open ? "close" : "menu"} />{open ? "Cerrar" : "Secciones"}
        </button>
        <nav id="main-nav" className={`main-nav ${open ? "is-open" : ""}`} aria-label="Secciones del informe">
          {NAV.map(n => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={active(n.href) ? "page" : undefined}>{n.label}</Link>)}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-cols">
          <div>
            <h2>ENCODAT · Informe interactivo de resultados</h2>
            <p>
              Explorador independiente. Muestra tablas precalculadas y revisadas; no recalcula estimaciones
              desde microdatos en el navegador. Última revisión de disponibilidad: {AUDIT_DATE}.
            </p>
            <p>
              Toda N de población mostrada es ponderada y dice cuál es: <strong>población estimada de la
              categoría</strong> (personas que cumplen la definición) o <strong>población estimada del universo
              analítico</strong> (el denominador del indicador). Cuando la fuente no la aporta se lee
              «No disponible»; no se sustituye por el número de casos de la muestra.
            </p>
            <p>
              La unidad geográfica es la región (9 regiones). No se publican estimaciones por entidad
              federativa: las entidades solo construyen los contornos. Sinaloa no está incluido en la encuesta.
            </p>
          </div>
          <div className="site-footer-links">
            <Link className="text-link" href="/metodologia">Fuentes y metodología</Link>
            <Link className="text-link" href="/datos">Datos y descargas</Link>
            <Link className="text-link" href="/metodologia#derivacion">Procedencia de las definiciones</Link>
            <Link className="text-link" href="/metodologia#geografia">Composición de las regiones</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
