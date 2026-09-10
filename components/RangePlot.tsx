"use client";
import { useId, useState } from "react";
import { isMean, unitSuffix, visibleReliability } from "@/lib/format";

export interface RangeItem {
  key: string; label: string; estimate: number; ci_low: number; ci_high: number;
  cv?: number | null; reliab?: string; color?: string; emphasis?: boolean;
}
export function EstimateDetail({ item, unit = "%" }: { item: RangeItem; unit?: string }) {
  const suffix = unitSuffix(unit);
  return <dl className="tnum">
    <div><dt>Estimación</dt><dd>{item.estimate.toFixed(1)}{suffix}</dd></div>
    <div><dt>IC 95%</dt><dd>{item.ci_low.toFixed(1)}–{item.ci_high.toFixed(1)}{suffix}</dd></div>
    <div><dt>CV</dt><dd>{item.cv == null ? "No disponible" : `${item.cv.toFixed(1)}%`}</dd></div>
    <div><dt>Confiabilidad</dt><dd>{visibleReliability(item.cv, item.reliab) ?? "No disponible"}</dd></div>
  </dl>;
}

export function RangePlot({ items, domainMax, valueDigits = 1, unit = "%", ariaLabel, selectedKey, onSelect }:
  { items: RangeItem[]; domainMax?: number; valueDigits?: number; unit?: string; ariaLabel?: string; selectedKey?: string; onSelect?: (key: string) => void }) {
  const [detail, setDetail] = useState<string>(); const id = useId();
  const suffix = unitSuffix(unit); const mean = isMean(unit);
  const maxData = Math.max(...items.map(d => d.ci_high), 1);
  const dmax = domainMax ?? (mean ? Math.ceil((maxData * 1.08) / 5) * 5 : Math.min(100, Math.max(10, Math.ceil(maxData / 10) * 10)));
  const x = (v: number) => 8 + v / dmax * 184;
  const activeKey = onSelect ? (selectedKey ?? detail) : detail;
  const item = items.find(d => d.key === activeKey);
  return <div aria-label={ariaLabel} role="group">
    <div className="plot-legend"><span><i />Estimación</span><span><i className="whisker" />IC 95%</span><span>○ Menor precisión, según clasificación</span></div>
    {items.length === 0 && <p className="empty-state">No hay estimaciones para esta combinación.</p>}
    {items.map(d => {
      const low = d.reliab === "media" || d.reliab === "baja";
      return <button key={d.key} className={`range-row ${d.emphasis ? "emphasized" : ""}`} aria-label={`${d.label}: ${d.estimate.toFixed(valueDigits)}${suffix}. Consultar detalle`} aria-expanded={activeKey === d.key} aria-controls={activeKey === d.key ? `${id}-detail` : undefined}
        onClick={() => { if (onSelect) { setDetail(d.key === "nac" ? (detail === "nac" ? undefined : "nac") : undefined); onSelect(d.key); } else setDetail(v => v === d.key ? undefined : d.key); }}
        onKeyDown={e => { if (e.key === "Escape") { setDetail(undefined); if (onSelect && selectedKey) onSelect(selectedKey); } }}>
        <span className="range-name">{d.label}</span>
        <div className="relative min-w-0"><svg viewBox="0 0 200 30" preserveAspectRatio="none" aria-hidden="true">
          {[0, .25, .5, .75, 1].map(t => <line key={t} x1={x(t * dmax)} x2={x(t * dmax)} y1={0} y2={30} stroke="#e4eae3" />)}
          <line x1={x(d.ci_low)} x2={x(d.ci_high)} y1={15} y2={15} stroke={d.color ?? "#137A80"} strokeWidth={3} />
          {[d.ci_low, d.ci_high].map((v, i) => <line key={i} x1={x(v)} x2={x(v)} y1={9} y2={21} stroke={d.color ?? "#137A80"} strokeWidth={1.5} />)}

        </svg><span className="plot-dot" style={{left:`${x(d.estimate)/2}%`,background:low?"#fff":d.color??"#137A80",borderColor:d.color??"#137A80"}} /></div>
        <span className="range-value tnum">{d.estimate.toFixed(valueDigits)}{suffix}</span>
      </button>;
    })}
    {items.length > 0 && <><div className="range-axis tnum"><span>0{suffix}</span><span>{dmax / 2}{suffix}</span><span>{dmax}{suffix}</span></div><p className="text-xs text-faint mt-3">Selecciona una fila para consultar sus cifras.</p></>}
    {item && <div id={`${id}-detail`} className="estimate-detail" role="region" aria-label={`Detalle de ${item.label}`}><strong>{item.label}</strong><EstimateDetail item={item} unit={unit} /></div>}
  </div>;
}
