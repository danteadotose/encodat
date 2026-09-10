"use client";
import { useId, useState } from "react";
import { makeScale } from "@/lib/scale";
import { REGION_GEO } from "@/lib/data";
import { isMean, unitSuffix } from "@/lib/format";
import type { EstimateRecord } from "@/lib/types";
import { EstimateDetail } from "./RangePlot";

export function RegionMap({ rows, onSelect, selected, unit = "%" }:
  { rows: EstimateRecord[]; onSelect?: (id: number) => void; selected?: number; unit?: string }) {
  const [inspect, setInspect] = useState<number>(); const id = useId();
  const current = onSelect ? selected : inspect;
  const choose = (region: number) => { if (onSelect) onSelect(region); else setInspect(v => v === region ? undefined : region); };
  const byRegion = new Map(rows.map(r => [r.region_id, r]));
  if (!rows.length) return <p className="empty-state">No hay estimaciones regionales para esta combinación.</p>;
  const scale = makeScale(rows.map(r => r.estimate)); const suffix = unitSuffix(unit);
  const { width, height, states, regions } = REGION_GEO;
  const rec = rows.find(r => r.region_id === current);
  return <div>
    <label className="field-label" htmlFor={`${id}-region`}>Consultar una región</label>
    <select className="field mb-4" id={`${id}-region`} value={current ?? ""} onChange={e => { if (e.target.value) choose(Number(e.target.value)); else if (current !== undefined) choose(current); }}>
      <option value="">Sin región resaltada</option>{regions.filter(r => byRegion.has(r.region_id)).map(r => <option key={r.region_id} value={r.region_id}>{r.name} · {byRegion.get(r.region_id)!.estimate.toFixed(1)}{suffix}</option>)}
    </select>
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="group" aria-label="Mapa de México coloreado por región ENCODAT">
      <title>Estimaciones por región. Los contornos estatales comparten el valor de su región.</title>
      {regions.map(r => {
        const row = byRegion.get(r.region_id); if (!row) return null;
        const active = current === r.region_id; const dim = current !== undefined && !active;
        return <g key={r.region_id} role="button" tabIndex={0} aria-label={`Región ${r.name}: ${row.estimate.toFixed(1)}${suffix}`} aria-pressed={active} className="region-shape"
          onClick={() => choose(r.region_id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(r.region_id); } if (e.key === "Escape" && current !== undefined) choose(current); }}>
          {states.filter(s => s.region_id === r.region_id).map(s => <path key={s.cve_ent} d={s.d} fill={scale.color(row.estimate)} fillOpacity={dim ? .4 : 1} stroke={active ? "#093B3E" : "#fff"} strokeWidth={active ? 2 : .6} style={{ transition: "fill-opacity .16s ease" }} />)}
        </g>;
      })}
      {states.filter(s => s.region_id === 0).map(s => <path key={s.cve_ent} d={s.d} fill="#efede6" stroke="#89948b" strokeWidth={.7} strokeDasharray="2 2"><title>{`${s.name}: no incluido`}</title></path>)}
      {regions.map(r => { const row = byRegion.get(r.region_id); if (!row) return null; return <text key={r.region_id} x={r.cx} y={r.cy} textAnchor="middle" dominantBaseline="middle" fontSize="24" fontWeight={700} fill="#15362d" pointerEvents="none" className="tnum region-map-label hidden sm:block" opacity={current !== undefined && current !== r.region_id ? .45 : 1}>{row.estimate.toFixed(1)}</text>; })}
    </svg>
    <div className="flex items-center gap-2 flex-wrap text-xs text-subink mt-4"><span className="tnum">{scale.min.toFixed(isMean(unit) ? 1 : 0)}{suffix}</span><span className="h-2 w-28 rounded" style={{background:"linear-gradient(90deg,#E3F0EF,#0C4F53)"}} /><span className="tnum">{scale.max.toFixed(isMean(unit) ? 1 : 0)}{suffix}</span><span className="ml-auto">Sinaloa: no incluido</span></div>
    <p className="text-xs text-faint mt-3">Cada estado se colorea según el valor de su región. No son estimaciones estatales.</p>
    {rec && <div className="estimate-detail" aria-label={`Detalle regional de ${rec.region_name}`} role="region"><div className="flex items-center justify-between gap-2"><strong>{rec.region_name}</strong><button className="btn btn-quiet" onClick={() => choose(rec.region_id)}>Quitar selección</button></div><EstimateDetail item={{...rec,key:String(rec.region_id),label:rec.region_name ?? "Región"}} unit={unit} /></div>}
  </div>;
}
