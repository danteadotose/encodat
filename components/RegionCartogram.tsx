"use client";
import React, { useState } from "react";
import { makeScale } from "@/lib/scale";
import type { EstimateRecord } from "@/lib/types";

// Schematic tile positions (cartogram) approximating Mexico's geography.
const TILE: Record<number, { r: number; c: number }> = {
  1: { r: 0, c: 0 }, 2: { r: 0, c: 1 }, 3: { r: 0, c: 2 },
  5: { r: 1, c: 1 }, 4: { r: 1, c: 2 },
  8: { r: 2, c: 0 }, 7: { r: 2, c: 1 }, 6: { r: 2, c: 2 },
  9: { r: 3, c: 2 },
};
const EXCLUDED_TILE = { r: 1, c: 0, label: "Sinaloa" };
const SHORT: Record<number, string> = {
  1: "Península", 2: "Nor-Occ.", 3: "Nor-central", 4: "Nor-Oriental",
  5: "Occidental", 6: "Cd. México", 7: "Centro", 8: "Centro-Sur", 9: "Sur",
};

export function RegionCartogram({
  rows, onSelect, selected,
}: { rows: EstimateRecord[]; onSelect?: (id: number) => void; selected?: number }) {
  const [hover, setHover] = useState<{ r: EstimateRecord; x: number; y: number } | null>(null);
  const byId = new Map(rows.map((r) => [r.region_id, r]));
  const scale = makeScale(rows.map((r) => r.estimate));
  const cols = 3, gap = 10, tile = 118;
  const W = 3 * tile + 2 * gap;
  const rowsN = 4;
  const H = rowsN * tile + (rowsN - 1) * gap;
  const xy = (r: number, c: number) => ({ x: c * (tile + gap), y: r * (tile + gap) });

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 520 }} role="img"
           aria-label="Cartograma regional">
        {Object.entries(TILE).map(([idStr, pos]) => {
          const id = Number(idStr);
          const rec = byId.get(id);
          if (!rec) return null;
          const { x, y } = xy(pos.r, pos.c);
          const fill = scale.color(rec.estimate);
          const txt = scale.text(rec.estimate);
          const isSel = selected === id;
          return (
            <g key={id} transform={`translate(${x},${y})`}
               onMouseMove={(e) => setHover({ r: rec, x: e.clientX, y: e.clientY })}
               onMouseLeave={() => setHover(null)}
               onClick={() => onSelect?.(id)}
               style={{ cursor: onSelect ? "pointer" : "default" }}>
              <rect width={tile} height={tile} rx={10} fill={fill}
                    stroke={isSel ? "#0C4F53" : "#ffffff"} strokeWidth={isSel ? 3 : 1.5} />
              <text x={tile / 2} y={tile / 2 - 6} textAnchor="middle" fontSize="12.5" fontWeight={600} fill={txt}>
                {SHORT[id]}
              </text>
              <text x={tile / 2} y={tile / 2 + 16} textAnchor="middle" fontSize="17" fontWeight={700} fill={txt} className="tnum">
                {rec.estimate.toFixed(1)}%
              </text>
            </g>
          );
        })}
        {/* Sinaloa — explicitly not surveyed */}
        {(() => {
          const { x, y } = xy(EXCLUDED_TILE.r, EXCLUDED_TILE.c);
          return (
            <g transform={`translate(${x},${y})`}>
              <rect width={tile} height={tile} rx={10} fill="#F3F1EB" stroke="#DAD6CC" strokeDasharray="4 4" />
              <text x={tile / 2} y={tile / 2 - 4} textAnchor="middle" fontSize="12" fontWeight={600} fill="#9A968C">Sinaloa</text>
              <text x={tile / 2} y={tile / 2 + 14} textAnchor="middle" fontSize="10.5" fill="#B2AEA3">no incluido</text>
            </g>
          );
        })()}
      </svg>

      {/* legend */}
      <div className="mt-3 flex items-center gap-2 text-xs text-subink">
        <span className="tnum">{scale.min.toFixed(0)}%</span>
        <div className="h-2 w-40 rounded" style={{ background: "linear-gradient(90deg,#E1F0EF,#0C4F53)" }} />
        <span className="tnum">{scale.max.toFixed(0)}%</span>
        <span className="ml-2">contorno esquemático</span>
      </div>

      {hover && (
        <div className="pointer-events-none fixed z-50 rounded-lg border hairline bg-white shadow-lg px-3 py-2 text-xs"
             style={{ left: hover.x + 14, top: hover.y + 14 }}>
          <div className="font-semibold">{hover.r.region_name}</div>
          <div className="tnum">{hover.r.estimate.toFixed(1)}% <span className="text-subink">(IC95 {hover.r.ci_low.toFixed(1)}–{hover.r.ci_high.toFixed(1)})</span></div>
          <div className="tnum text-subink">n={hover.r.n.toLocaleString("es-MX")} · CV {hover.r.cv?.toFixed(1)}%</div>
        </div>
      )}
    </div>
  );
}
