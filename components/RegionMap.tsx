"use client";
import { useId, useState } from "react";
import { makeScale, SEQ_STROKE } from "@/lib/scale";
import { REGION_GEO, EXCLUDED } from "@/lib/data";
import { isMean, unitSuffix } from "@/lib/format";
import type { EstimateRecord } from "@/lib/types";
import { EstimateDetail } from "./RangePlot";

/**
 * Coropleta por región. Las entidades solo construyen las geometrías: no son
 * unidades con estimación propia y la interfaz lo dice. Sinaloa se dibuja
 * hachurado como «no incluido en la encuesta», nunca imputado.
 * Seis clases discretas, no un degradado continuo, y cada región lleva su
 * cifra impresa: el color no es el único portador del dato.
 */
export function RegionMap({ rows, onSelect, selected, unit = "%" }:
  { rows: EstimateRecord[]; onSelect?: (id: number) => void; selected?: number; unit?: string }) {
  const [inspect, setInspect] = useState<number>(); const [hovered, setHovered] = useState<number>(); const id = useId();
  const current = onSelect ? selected : inspect;
  const choose = (region: number) => { if (onSelect) onSelect(region); else setInspect(v => v === region ? undefined : region); };
  const byRegion = new Map(rows.map(r => [r.region_id, r]));
  if (!rows.length) return <p className="empty-state">No hay estimaciones regionales publicables para esta combinación de filtros.</p>;
  const scale = makeScale(rows.map(r => r.estimate)); const suffix = unitSuffix(unit);
  const { width, height, states, regions } = REGION_GEO;
  const rec = rows.find(r => r.region_id === (hovered ?? current));
  const digits = isMean(unit) ? 1 : 1;
  const excludedNames = EXCLUDED.map(e => e.name).join(", ");
  return <div>
    <label className="field-label" htmlFor={`${id}-region`}>Consultar una región</label>
    <select className="field mb-4" id={`${id}-region`} value={current ?? ""} onChange={e => { if (e.target.value) choose(Number(e.target.value)); else if (current !== undefined) choose(current); }}>
      <option value="">Sin región resaltada</option>
      {regions.filter(r => byRegion.has(r.region_id)).map(r => <option key={r.region_id} value={r.region_id}>{r.name} · {byRegion.get(r.region_id)!.estimate.toFixed(digits)}{suffix}</option>)}
    </select>
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="group" aria-label="Mapa de México por región ENCODAT. Cada región lleva su estimación impresa.">
      <title>Estimaciones por región, en seis clases. Gris hachurado: entidad no incluida en la encuesta. Gris liso: región fuera del filtro actual o sin estimación publicable. Los contornos estatales comparten el valor de su región y no son estimaciones estatales.</title>
      {regions.map(r => {
        const row = byRegion.get(r.region_id);
        if (!row) return <g key={r.region_id}>{states.filter(s => s.region_id === r.region_id).map(s => <path key={s.cve_ent} d={s.d} fill="#ECEFEA" stroke={SEQ_STROKE} strokeWidth={.6}><title>{`${s.name} · ${r.name}: sin estimación publicable en este filtro`}</title></path>)}</g>;
        const active = current === r.region_id; const dim = current !== undefined && !active;
        return <g key={r.region_id} role="button" tabIndex={0}
          aria-label={`Región ${r.name}: ${row.estimate.toFixed(digits)}${suffix}${active ? ", seleccionada" : ""}`}
          aria-pressed={active} className="region-shape"
          onMouseEnter={() => setHovered(r.region_id)} onMouseLeave={() => setHovered(undefined)}
          onClick={() => choose(r.region_id)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(r.region_id); } if (e.key === "Escape" && current !== undefined) choose(current); }}>
          {states.filter(s => s.region_id === r.region_id).map(s => <path key={s.cve_ent} d={s.d}
            fill={scale.color(row.estimate)} fillOpacity={dim ? .45 : 1}
            stroke={active ? "#15211F" : SEQ_STROKE} strokeWidth={active ? 2.2 : .6} />)}
        </g>;
      })}
      <defs><pattern id={`${id}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#EDEBE4" /><line x1="0" y1="0" x2="0" y2="6" stroke="#6F7B73" strokeWidth="1.4" /></pattern></defs>
      {states.filter(s => s.region_id === 0).map(s => <path key={s.cve_ent} d={s.d} fill={`url(#${id}-hatch)`} stroke="#6F7B73" strokeWidth={.9}><title>{`${s.name}: no incluido en la encuesta`}</title></path>)}
      {regions.map(r => { const row = byRegion.get(r.region_id); if (!row) return null; return <text key={r.region_id} x={r.cx} y={r.cy} textAnchor="middle" dominantBaseline="middle" fontSize="24" fontWeight={700} fill={scale.text(row.estimate)} pointerEvents="none" className="tnum region-map-label" opacity={current !== undefined && current !== r.region_id ? .5 : 1}>{row.estimate.toFixed(digits)}</text>; })}
    </svg>
    <div className="map-legend">
      <span className="tnum">{scale.min.toFixed(digits)}{suffix}</span>
      <span className="legend-steps" role="img" aria-label={`Escala de seis clases, de ${scale.min.toFixed(digits)}${suffix} a ${scale.max.toFixed(digits)}${suffix}`}>
        {scale.steps.map(c => <i key={c} style={{ background: c, borderTop: `1px solid ${SEQ_STROKE}`, borderBottom: `1px solid ${SEQ_STROKE}` }} />)}
      </span>
      <span className="tnum">{scale.max.toFixed(digits)}{suffix}</span>
      <span className="legend-note">Seis clases iguales entre el mínimo y el máximo del filtro actual.</span>
    </div>
    <p className="map-note">
      La cifra impresa en cada región es su estimación. Cada entidad se colorea con el valor de <em>su región</em>:
      no hay estimaciones por entidad federativa. {excludedNames ? `${excludedNames}: no incluido en la encuesta (hachurado).` : ""}
    </p>
    {rec && <div className="estimate-detail" aria-label={`Detalle regional de ${rec.region_name}`} role="region">
      <div className="flex items-center justify-between gap-2 flex-wrap"><strong>{rec.region_name}</strong><button type="button" className="btn btn-quiet" onClick={() => choose(rec.region_id)}>Quitar selección</button></div>
      <EstimateDetail item={{ ...rec, key: String(rec.region_id), label: rec.region_name ?? "Región" }} unit={unit} />
    </div>}
  </div>;
}
