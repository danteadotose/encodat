"use client";
import { useId, useState } from "react";
import { isMean, unitSuffix, visibleReliability, weightedNKind, RELIAB_LABEL, RELIAB_HINT } from "@/lib/format";
import { WeightedN } from "./ui";

export interface RangeItem {
  key: string; label: string; estimate: number; ci_low: number; ci_high: number;
  pop?: number | null; weighted_n?: number | null; weighted_n_meaning?: string | null;
  source_locator?: string; cv?: number | null; reliab?: string; color?: string; emphasis?: boolean;
  scopeNote?: string;
}

/** Ficha de una observación: las mismas cifras que la gráfica, la tabla y la descarga. */
export function EstimateDetail({ item, unit = "%" }: { item: RangeItem; unit?: string }) {
  const suffix = unitSuffix(unit);
  const shown = visibleReliability(item.cv, item.reliab);
  return (
    <>
      <dl className="tnum">
        <div><dt>Estimación</dt><dd>{item.estimate.toFixed(1)}{suffix}</dd></div>
        <div><dt>IC 95 %</dt><dd>{item.ci_low.toFixed(1)}–{item.ci_high.toFixed(1)}{suffix}</dd></div>
        <div><dt>Coeficiente de variación</dt><dd>{item.cv == null ? "No disponible" : `${item.cv.toFixed(1)} %`}</dd></div>
        <div><dt>Precisión</dt><dd>{shown ? `${RELIAB_LABEL[shown]} · ${RELIAB_HINT[shown]}` : "No disponible"}</dd></div>
        <div><WeightedN value={item.weighted_n} kind={weightedNKind(item.weighted_n_meaning) ?? "categoria"} compact /></div>
        <div><WeightedN value={item.pop} kind="universo" compact /></div>
      </dl>
      <p className="mt-3 text-sm text-subink">
        Fuente: {item.source_locator ?? "No disponible"}.
        {item.scopeNote ? ` ${item.scopeNote}` : ""}
      </p>
    </>
  );
}

export function RangePlot({ items, domainMax, valueDigits = 1, unit = "%", ariaLabel, selectedKey, onSelect }:
  { items: RangeItem[]; domainMax?: number; valueDigits?: number; unit?: string; ariaLabel?: string; selectedKey?: string; onSelect?: (key: string) => void }) {
  const [detail, setDetail] = useState<string>(); const [hover, setHover] = useState<string>(); const id = useId();
  const suffix = unitSuffix(unit); const mean = isMean(unit);
  const maxData = Math.max(...items.map(d => d.ci_high), 1);
  const dmax = domainMax ?? (mean ? Math.ceil((maxData * 1.08) / 5) * 5 : Math.min(100, Math.max(10, Math.ceil(maxData / 10) * 10)));
  const x = (v: number) => 8 + v / dmax * 184;
  const activeKey = onSelect ? (selectedKey ?? detail ?? hover) : (detail ?? hover);
  const item = items.find(d => d.key === activeKey);
  if (!items.length) return <p className="empty-state">No hay estimaciones publicables para esta combinación de filtros. La consulta es válida; la cifra es la que falta.</p>;
  return <div aria-label={ariaLabel} role="group">
    <div className="plot-legend">
      <span><i aria-hidden="true" />Estimación puntual</span>
      <span><i className="whisker" aria-hidden="true" />IC 95 %</span>
      <span><i className="hollow" aria-hidden="true" />Punto hueco: precisión media o baja (CV ≥ 15 %)</span>
    </div>
    {items.map(d => {
      const low = d.reliab === "media" || d.reliab === "baja";
      return <button key={d.key} type="button" className={`range-row ${d.emphasis ? "emphasized" : ""}`}
        aria-label={`${d.label}: ${d.estimate.toFixed(valueDigits)}${suffix}, IC 95 % de ${d.ci_low.toFixed(valueDigits)} a ${d.ci_high.toFixed(valueDigits)}${suffix}. Consultar detalle`}
        aria-expanded={activeKey === d.key} aria-controls={activeKey === d.key ? `${id}-detail` : undefined}
        onClick={() => { if (onSelect) { setDetail(d.key === "nac" ? (detail === "nac" ? undefined : "nac") : undefined); onSelect(d.key); } else setDetail(v => v === d.key ? undefined : d.key); }}
        onMouseEnter={() => setHover(d.key)} onMouseLeave={() => setHover(undefined)} onFocus={() => setHover(d.key)} onBlur={() => setHover(undefined)}
        onKeyDown={e => { if (e.key === "Escape") { setDetail(undefined); setHover(undefined); if (onSelect && selectedKey) onSelect(selectedKey); } }}>
        <span className="range-name">{d.label}</span>
        <div className="relative min-w-0"><svg viewBox="0 0 200 30" preserveAspectRatio="none" aria-hidden="true">
          {[0, .25, .5, .75, 1].map(t => <line key={t} x1={x(t * dmax)} x2={x(t * dmax)} y1={0} y2={30} stroke="#E6EAE5" />)}
          <line x1={x(d.ci_low)} x2={x(d.ci_high)} y1={15} y2={15} stroke={d.color ?? "#0B5A52"} strokeWidth={3} />
          {[d.ci_low, d.ci_high].map((v, i) => <line key={i} x1={x(v)} x2={x(v)} y1={9} y2={21} stroke={d.color ?? "#0B5A52"} strokeWidth={1.5} />)}
        </svg><span className="plot-dot" style={{ left: `${x(d.estimate) / 2}%`, background: low ? "#fff" : d.color ?? "#0B5A52", borderColor: d.color ?? "#0B5A52" }} /></div>
        <span className="range-value tnum">{d.estimate.toFixed(valueDigits)}{suffix}</span>
      </button>;
    })}
    <div className="range-axis tnum" aria-hidden="true"><span>0{suffix}</span><span>{dmax / 2}{suffix}</span><span>{dmax}{suffix}</span></div>
    <p className="plot-hint">Pasa el cursor, enfoca con el teclado o activa una fila para consultar sus cifras. Las diferencias visibles entre filas son descriptivas: no constituyen una prueba de significancia.</p>
    {item && <div id={`${id}-detail`} className="estimate-detail" role="region" aria-label={`Detalle de ${item.label}`}><strong>{item.label}</strong><EstimateDetail item={item} unit={unit} /></div>}
  </div>;
}
