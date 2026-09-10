"use client";
import { useEffect, useId, useRef, useState } from "react";
import { indicatorsByCategory, getIndicator } from "@/lib/data";

export function Icon({ name, className = "" }: { name: "search" | "link" | "reset" | "download" | "chevron" | "close" | "menu"; className?: string }) {
  const paths = { search: "m21 21-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0", link: "m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0", reset: "M3 10a9 9 0 1 1 1 8M3 3v7h7", download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5", chevron: "m6 9 6 6 6-6", close: "m6 6 12 12M6 18 18 6", menu: "M4 6h16M4 12h16M4 18h16" };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${className}`}><path d={paths[name]} /></svg>;
}

export function ShareView({ href }: { href: string }) {
  const [state, setState] = useState<"idle" | "copied" | "fallback">("idle");
  const [link, setLink] = useState("");
  useEffect(() => { setState("idle"); }, [href]);
  useEffect(() => { if (state !== "copied") return; const timer = setTimeout(() => setState("idle"), 3500); return () => clearTimeout(timer); }, [state]);
  return <div className="share-control">
    <button className="btn btn-secondary" onClick={async () => {
      const url = new URL(href, window.location.origin).href; setLink(url);
      try { await navigator.clipboard.writeText(url); setState("copied"); } catch { setState("fallback"); }
    }}><Icon name="link" />{state === "copied" ? "Enlace copiado" : "Copiar enlace"}</button>
    <span className="sr-only" role="status">{state === "copied" ? "Enlace de esta vista copiado" : ""}</span>
    {state === "fallback" && <label className="block text-sm mt-2">Copia este enlace<input className="field mt-1" readOnly value={link} onFocus={e => e.target.select()} /></label>}
  </div>;
}

export function IndicatorPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [search, setSearch] = useState(""); const ref = useRef<HTMLDetailsElement>(null); const id = useId();
  const normal = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const groups = indicatorsByCategory().map(g => ({ ...g, items: g.items.filter(i => normal(search).trim().split(/\s+/).every(term => normal(`${i.label} ${i.short_label} ${i.category} ${i.period}`).includes(term))) })).filter(g => g.items.length);
  useEffect(() => {
    const close = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) ref.current.open = false; };
    document.addEventListener("pointerdown", close); return () => document.removeEventListener("pointerdown", close);
  }, []);
  return <div className="min-w-0">
    <span className="field-label" id={`${id}-label`}>Indicador</span>
    <details ref={ref} className="indicator-picker" onKeyDown={e => { if (e.key === "Escape" && ref.current) { ref.current.open = false; ref.current.querySelector("summary")?.focus(); } }}>
      <summary aria-labelledby={`${id}-label ${id}-value`} className="field picker-trigger"><span id={`${id}-value`}>{getIndicator(value)?.short_label ?? "Elegir indicador"}</span><Icon name="chevron" /></summary>
      <div className="picker-panel">
        <label className="search-field"><Icon name="search" /><input type="search" aria-label="Buscar indicador" placeholder="Buscar indicador o tema…" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <div className="picker-options" aria-label="Indicadores disponibles">
          {groups.map(g => <div key={g.category}><div className="picker-category">{g.category}</div>{g.items.map(i => <button key={i.indicator_id} aria-pressed={value === i.indicator_id} onClick={() => { onChange(i.indicator_id); setSearch(""); if (ref.current) { ref.current.open = false; ref.current.querySelector("summary")?.focus(); } }}><span>{i.short_label}<small>{i.period}</small></span><span aria-hidden="true">{value === i.indicator_id ? "✓" : ""}</span></button>)}</div>)}
          {!groups.length && <div className="empty-state"><p>No hay indicadores con esa búsqueda.</p><button className="btn btn-secondary mt-3" onClick={() => setSearch("")}>Limpiar búsqueda</button></div>}
        </div>
      </div>
    </details>
  </div>;
}

export function ReadingGuide() {
  return <details className="reading-guide"><summary>Cómo leer las cifras</summary><dl className="grid sm:grid-cols-3 gap-4 mt-4">
    <div><dt>IC 95%</dt><dd>Intervalo de confianza al 95% que acompaña a la estimación y expresa su incertidumbre.</dd></div>
    <div><dt>CV</dt><dd>Coeficiente de variación: error estándar relativo, en porcentaje. Un valor menor indica mayor precisión.</dd></div>
    <div><dt>N y n</dt><dd>N corresponde a población ponderada; n es el tamaño de muestra sin ponderar, disponible en el CSV.</dd></div>
  </dl></details>;
}

// Marks hydration completion for browser checks without exposing a loading screen.
export function ClientReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return <span hidden data-ready={ready ? "true" : "false"} />;
}
