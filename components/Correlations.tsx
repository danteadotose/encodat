"use client";
import React, { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ClientReady, ShareView, Icon } from "./Controls";
import { CORR, CORR_PAIRS } from "@/lib/data";
import type { CorrPair } from "@/lib/types";
import { SectionHeading, Card } from "./ui";

const CAT_COLOR: Record<string, string> = {
  "Drogas": "#137A80", "Drogas médicas": "#0E6E5E", "Alcohol": "#B4611F",
  "Salud mental": "#33517E", "Comportamiento suicida": "#8A3A5B", "Violencia": "#7A4E2B",
  "Juego y videojuegos": "#5B6B21", "Tabaco": "#6B4A8A",
};
const catColor = (c: string) => CAT_COLOR[c] ?? "#6b6a63";

function Chip({ cat }: { cat: string }) {
  return <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-1.5 py-0.5"
    style={{ color: catColor(cat), background: `${catColor(cat)}14` }}>{cat}</span>;
}

function sig(p: number) {
  if (p < 0.001) return "p < 0.001";
  return `p = ${p.toFixed(3)}`;
}

export function Correlations() {
  const inds = CORR.indicators;
  const sp=useSearchParams(), pathname=usePathname();
  const setParams=(patch:Record<string,string|null>)=>{const p=new URLSearchParams(window.location.search);p.delete("pagina");Object.entries(patch).forEach(([k,v])=>v===null?p.delete(k):p.set(k,v));window.history.replaceState(null,"",`${pathname}?${p}`);};
  const focus=inds.some(i=>i.id===sp.get("indicador"))?sp.get("indicador")!:"all";
  const hideRedundant=sp.get("anidados")!=="1";
  const onlySig=sp.get("significativos")!=="todos";
  const sortKey: "phi"|"or"|"joint"=sp.get("orden")==="or"?"or":sp.get("orden")==="joint"?"joint":"phi";
  const q=sp.get("buscar")??"";
  const setFocus=(v:string)=>setParams({indicador:v==="all"?null:v});
  const setHideRedundant=(v:boolean)=>setParams({anidados:v?null:"1"});
  const setOnlySig=(v:boolean)=>setParams({significativos:v?null:"todos"});
  const setSortKey=(v:string)=>setParams({orden:v});
  const setQ=(v:string)=>setParams({buscar:v||null});
  const reset=()=>window.history.replaceState(null,"",pathname);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    let out = CORR_PAIRS.filter((p) =>
      (!hideRedundant || !p.redundante) &&
      (!onlySig || p.p < 0.05) &&
      (focus === "all" || p.a === focus || p.b === focus) &&
      (!t || `${p.a_label} ${p.b_label}`.toLowerCase().includes(t)));
    out = out.slice().sort((x, y) =>
      sortKey === "or" ? (y.odds_ratio ?? 0) - (x.odds_ratio ?? 0)
      : sortKey === "joint" ? y.prev_joint - x.prev_joint
      : Math.abs(y.phi) - Math.abs(x.phi));
    return out;
  }, [focus, hideRedundant, onlySig, sortKey, q]);

  // orient the pair so the focused indicator (or the more prevalent one) is "A"
  const orient = (p: CorrPair) => {
    if (focus !== "all" && p.b === focus) return { a: p.b, b: p.a, a_label: p.b_label, b_label: p.a_label, a_cat: p.b_cat, b_cat: p.a_cat, pab: p.p_a_given_b, pba: p.p_b_given_a };
    return { a: p.a, b: p.b, a_label: p.a_label, b_label: p.b_label, a_cat: p.a_cat, b_cat: p.b_cat, pab: p.p_b_given_a, pba: p.p_a_given_b };
  };
  const phiMax = 0.7;
  const totalPages=Math.max(1,Math.ceil(rows.length/30));
  const requestedPage=Number(sp.get("pagina")??1);
  const page=Number.isInteger(requestedPage)?Math.max(1,Math.min(totalPages,requestedPage)):1;
  const changePage=(n:number)=>{const p=new URLSearchParams(window.location.search);p.set("pagina",String(n));window.history.replaceState(null,"",`${pathname}?${p}`);};

  return (
    <div className="space-y-8"><ClientReady />
      <header>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3"><span className="chip">Co-ocurrencia individual</span><ShareView href={`${pathname}?${sp}`} /></div>
        <h1 className="font-display text-[2.4rem] sm:text-[2.75rem] leading-[1.05] font-bold text-ink">Correlaciones entre indicadores</h1>
        <div className="grid lg:grid-cols-2 gap-5 mt-4"><p className="text-subink max-w-measure text-base">
          Con qué fuerza <em>co-ocurren</em>, en las mismas personas (12 a 65 años), pares de condiciones binarias de la ENCODAT 2025.
          Cada medida usa el factor de expansión y el diseño muestral complejo: razón de momios (OR) y coeficiente phi, con
          significancia estimada por <strong>bootstrap Rao-Wu</strong> ({CORR.n_bootstrap} réplicas de UPM dentro de estratos).
        </p>
        <div className="rounded-xl border border-amber-soft/60 bg-amber/[.07] px-4 py-3 text-sm text-ink max-w-measure">
          <strong>La correlación no implica causalidad.</strong> Estas medidas describen co-ocurrencia a nivel de personas; no
          establecen que una condición cause la otra ni controlan por edad, sexo u otros factores. Con {inds.length} indicadores se
          evalúan cientos de pares, por lo que algunos resultados significativos pueden deberse al azar (comparaciones múltiples).
          Interpretar como señales exploratorias, no confirmatorias.
        </div>
        </div>
      </header>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <div className="flex flex-col min-w-0 w-full sm:w-auto sm:max-w-sm">
            <label htmlFor="foc" className="field-label">Indicador de interés</label>
            <select id="foc" value={focus} onChange={(e) => setFocus(e.target.value)}
              className="field">
              <option value="all">Todos los pares</option>
              {inds.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col min-w-0 w-full sm:w-auto sm:max-w-sm">
            <label htmlFor="sort" className="field-label">Ordenar por</label>
            <select id="sort" value={sortKey} onChange={(e) => setSortKey(e.target.value)}
              className="field">
              <option value="phi">Fuerza (|phi|)</option>
              <option value="or">Razón de momios (OR)</option>
              <option value="joint">Prevalencia conjunta</option>
            </select>
          </div>
          <label className="w-full sm:w-56"><span className="field-label">Buscar par</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar indicador…" aria-label="Buscar par"
            className="field" /></label>
          <label className="inline-flex items-center gap-2 text-sm text-subink cursor-pointer select-none">
            <input type="checkbox" checked={onlySig} onChange={(e) => setOnlySig(e.target.checked)} className="accent-teal-deep w-4 h-4" />
            Solo significativos (p &lt; 0.05)
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-subink cursor-pointer select-none">
            <input type="checkbox" checked={hideRedundant} onChange={(e) => setHideRedundant(e.target.checked)} className="accent-teal-deep w-4 h-4" />
            Ocultar pares anidados por definición
          </label>
          <button className="btn btn-quiet" onClick={reset}><Icon name="reset" />Restablecer</button><span className="text-subink text-sm tnum ml-auto" role="status">{rows.length} pares</span>
        </div>
      </Card>

      <div className="space-y-2.5">
        <div className="hidden md:grid grid-cols-[minmax(0,1fr)_92px_88px_110px_118px] gap-3 px-4 text-xs uppercase tracking-[.06em] text-faint font-semibold">
          <span>Par de indicadores</span><span className="text-right">phi</span><span className="text-right">OR</span>
          <span className="text-right">Conjunta</span><span className="text-right">Significancia</span>
        </div>
        {rows.slice((page-1)*30,page*30).map((p) => {
          const o = orient(p);
          const w = Math.min(100, (Math.abs(p.phi) / phiMax) * 100);
          return (
            <div key={`${p.a}|${p.b}`} className="rounded-2xl border hairline bg-surface shadow-card px-4 py-3.5 md:grid md:grid-cols-[minmax(0,1fr)_92px_88px_110px_118px] md:gap-3 md:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
                  <span className="font-semibold text-ink">{o.a_label}</span>
                  <span className="text-faint">↔</span>
                  <span className="font-semibold text-ink">{o.b_label}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <Chip cat={o.a_cat} /><Chip cat={o.b_cat} />
                  {p.redundante && <span className="text-xs text-faint">· anidado por definición</span>}
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-teal-wash overflow-hidden max-w-[280px]">
                  <div className="h-full rounded-full" style={{ width: `${w}%`, background: p.phi >= 0 ? "#137A80" : "#B4611F" }} />
                </div>
                <details className="text-sm text-subink mt-2 tnum"><summary className="min-h-[32px] text-teal-deep font-medium">Ver detalle del par</summary><div className="py-2">
                  De quienes tienen <span className="font-medium">{o.a_label}</span>, {o.pab ?? "—"}% también <span className="font-medium">{o.b_label.toLowerCase()}</span>
                  <span className="text-faint"> · conjunta {p.prev_joint}% · lift ×{p.lift ?? "—"}</span>
                </div></details>
              </div>
              <div className="tnum text-right font-semibold text-ink mt-2 md:mt-0"><span className="md:hidden text-faint text-xs mr-1">phi</span>{p.phi >= 0 ? "+" : ""}{p.phi.toFixed(3)}</div>
              <div className="tnum text-right text-ink"><span className="md:hidden text-faint text-xs mr-1">OR</span>{p.odds_ratio ?? "—"}</div>
              <div className="tnum text-right text-subink"><span className="md:hidden text-faint text-xs mr-1">conjunta</span>{p.prev_joint}%</div>
              <div className="text-right">
                <span className={`tnum text-[12px] font-medium ${p.p < 0.05 ? "text-teal-deep" : "text-faint"}`}>{sig(p.p)}</span>
                <div className="text-xs text-faint tnum">n = {p.n11.toLocaleString("es-MX")} casos</div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="empty-state"><p>No hay pares con los filtros actuales.</p><button className="btn btn-secondary mt-3" onClick={reset}>Restablecer filtros</button></div>}
      </div>

      {totalPages>1&&<div className="pagination"><span>{(page-1)*30+1}–{Math.min(page*30,rows.length)} de {rows.length} pares</span><div className="flex items-center gap-3"><button className="btn btn-secondary" disabled={page===1} onClick={()=>changePage(page-1)}>Anterior</button><span>Página {page} de {totalPages}</span><button className="btn btn-secondary" disabled={page===totalPages} onClick={()=>changePage(page+1)}>Siguiente</button></div></div>}
      <Card className="p-6 bg-paper/50 text-sm text-subink space-y-2.5">
        <div><span className="font-semibold text-ink">Método.</span> {CORR.method}. Dominio: {CORR.domain}. Solo se incluyen indicadores binarios con base poblacional (para que las tablas 2×2 compartan denominador) y pares con al menos {CORR.min_n11} casos conjuntos en la muestra.</div>
        <div><span className="font-semibold text-ink">Cómo leer.</span> <strong>phi</strong> es una correlación entre dos variables binarias (−1 a 1). <strong>OR</strong> (razón de momios) &gt; 1 indica que tener una condición se asocia a mayor probabilidad de la otra. <strong>Lift</strong> compara la co-ocurrencia observada con la esperada si fueran independientes. La significancia proviene del bootstrap de conglomerados; <strong>n</strong> es el número de personas en la muestra con ambas condiciones (soporte).</div>
      </Card>
    </div>
  );
}
