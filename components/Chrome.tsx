"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Icon } from "./Controls";
import { usePathname } from "next/navigation";
import { DATASET_YEAR, DATA_SOURCE } from "@/lib/data";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/explorar", label: "Explorar" },
  { href: "/correlaciones", label: "Correlaciones" },
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
        <Link href="/" className="brand" aria-label={`ENCODAT ${DATASET_YEAR} · Inicio`}>
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>ENCODAT <strong>{DATASET_YEAR}</strong><small>Explorador de resultados</small></span>
        </Link>
        <button id="nav-toggle" className="btn btn-secondary nav-toggle" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"} />{open ? "Cerrar" : "Menú"}</button>
        <nav id="main-nav" className={`main-nav ${open ? "is-open" : ""}`} aria-label="Principal">
          {NAV.map(n => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={active(n.href) ? "page" : undefined}>{n.label}</Link>)}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t hairline bg-white/50">
      <div className="mx-auto max-w-6xl px-5 py-8 text-sm text-subink space-y-3">
        <p className="max-w-measure">
          Fuente: <strong className="text-ink">{DATA_SOURCE}</strong>. Estimaciones <strong>ponderadas</strong> con el
          diseño muestral complejo de la encuesta (factor de expansión, estratos y conglomerados) y validadas contra el
          Resumen Ejecutivo oficial de la ENCODAT {DATASET_YEAR}.
        </p>
        <p className="max-w-measure text-faint">
          Los análisis geográficos son <strong className="text-subink">por 9 regiones</strong>, no por entidad
          federativa. En el mapa cada estado se colorea según el valor de <em>su región</em>. La <strong className="text-subink">población (N)</strong> es
          la estimación ponderada; el tamaño de muestra sin ponderar (n) se conserva solo en las descargas CSV, no en las
          visualizaciones. Las correlaciones describen co-ocurrencia entre indicadores y <strong className="text-subink">no implican causalidad</strong>.
          Explorador independiente con fines informativos.
        </p>
      </div>
    </footer>
  );
}
