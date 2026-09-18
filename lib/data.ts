import estimatesRaw from "@/data/estimates_reviewed.json";
import indicatorsRaw from "@/data/indicators.json";
import regionsRaw from "@/data/regions.json";
import regionGeoRaw from "@/data/region_geo.json";
import releaseRaw from "@/data/release_manifest.json";
import type { EstimateRecord, IndicatorMeta, Region, Sex, AgeGroup, RegionGeo, CorrData, CorrPair } from "./types";

export const RECORDS = (estimatesRaw.records as EstimateRecord[]);
export const DATASET_YEAR = estimatesRaw.year as number;
export const INDICATORS = (indicatorsRaw.indicators as IndicatorMeta[]);
export const CATEGORY_ORDER = ((indicatorsRaw as any).category_order as string[]) ?? [];
export const DATA_SOURCE = indicatorsRaw.source as string;
export const RELEASE = releaseRaw;
export function availabilityReason(id: string) { return releaseRaw.availability.find(r => r.indicator_id === id && !r.allow_results)?.reason ?? "Falta evidencia de validación para este desglose."; }
export const REGIONS = (regionsRaw.regions as Region[]);
export const REGION_GEO = (regionGeoRaw as unknown as RegionGeo);
export const EXCLUDED = regionsRaw.excluded_entidades as { cve_ent: number; name: string; reason: string }[];
export const REGIONS_NOTE = regionsRaw.note as string;

export const getIndicator = (id: string) => INDICATORS.find((i) => i.indicator_id === id);
export const defaultIndicatorId = () => "alc_alguna_vez";

export interface Query { indicator_id: string; sex?: Sex; age_group?: AgeGroup; geo_level?: "nacional" | "region"; region_id?: number; }
export function query(q: Query): EstimateRecord[] {
  return RECORDS.filter((r) => {
    if (r.indicator_id !== q.indicator_id) return false;
    if (q.sex && r.sex !== q.sex) return false;
    if (q.age_group && r.age_group !== q.age_group) return false;
    if (q.geo_level && r.geo_level !== q.geo_level) return false;
    if (q.region_id !== undefined && r.region_id !== q.region_id) return false;
    return true;
  });
}
export function one(q: Query): EstimateRecord | undefined { return query(q)[0]; }
export function national(indicator_id: string, sex: Sex, age_group: AgeGroup) { return one({ indicator_id, sex, age_group, geo_level: "nacional" }); }
export function availableSexes(indicator_id: string): Sex[] {
  const s = new Set(RECORDS.filter((r) => r.indicator_id === indicator_id).map((r) => r.sex));
  return (["total", "hombres", "mujeres"] as Sex[]).filter((x) => s.has(x));
}
export function availableAges(indicator_id: string): AgeGroup[] {
  const s = new Set(RECORDS.filter((r) => r.indicator_id === indicator_id).map((r) => r.age_group));
  return (["12-65", "12-17", "18-65"] as AgeGroup[]).filter((x) => s.has(x));
}
const CSV_COLS = ["year","indicator_id","kind","geo_level","region_id","region_name","sex","age_group","estimate","ci_low","ci_high","se","cv","reliab","weighted_n","weighted_n_meaning","weighted_denominator_n","weighted_denominator_meaning","source_locator"] as const;
export function toCSV(rows: EstimateRecord[]): string {
  const head = CSV_COLS.join(",");
  const body = rows.map((r) => CSV_COLS.map((c) => { const v = c === "weighted_denominator_n" ? r.pop : c === "weighted_denominator_meaning" ? "poblacion_ponderada_del_universo_analitico" : c === "reliab" && r.cv == null ? null : r[c]; if (v === null || v === undefined) return "No disponible"; if (typeof v === "string" && (v.includes(",") || v.includes('"'))) return `"${v.replace(/"/g, '""')}"`; return String(v); }).join(","));
  return [head, ...body].join("\n");
}
export function downloadCSV(filename: string, rows: EstimateRecord[]) {
  const blob = new Blob(["﻿" + toCSV(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  // Let the browser consume the Blob before releasing its URL.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export function indicatorsByCategory(): { category: string; items: IndicatorMeta[] }[] {
  const seen: string[] = []; const map: Record<string, IndicatorMeta[]> = {};
  for (const i of INDICATORS) { if (!map[i.category]) { map[i.category] = []; seen.push(i.category); } map[i.category].push(i); }
  const order = CATEGORY_ORDER.length ? CATEGORY_ORDER.filter((c) => map[c]).concat(seen.filter((c) => !CATEGORY_ORDER.includes(c))) : seen;
  return order.map((c) => ({ category: c, items: map[c] }));
}

/* ------------------------------------------------------------------ *
 * Añadido en la ronda 2026-09-17 (agente 1). Solo lectura de los
 * metadatos que la Ola A publicó: disponibilidad por indicador,
 * variables derivadas y huecos nominales de la sintaxis oficial.
 * No calcula ni reconstruye ninguna cifra.
 * ------------------------------------------------------------------ */
import type { AvailabilityEntry, BlockedCell, DerivedVariableMeta, SyntaxSource } from "./types";

export const AVAILABILITY = (releaseRaw.availability as unknown as AvailabilityEntry[]);
export const BLOCKED_CELLS = (releaseRaw.blocked_cells as unknown as BlockedCell[]);
export const DERIVED_VARIABLES = (((indicatorsRaw as any).derived_variables ?? {}) as Record<string, DerivedVariableMeta>);
export const SYNTAX_SOURCE_VALUES = (((indicatorsRaw as any).syntax_source_values ?? {}) as Record<string, string>);
export const SYNTAX_GAPS = (((indicatorsRaw as any).syntax_gaps ?? []) as string[]);
export const AUDIT_DATE = (releaseRaw as any).audit_date as string;

/** Ids de indicadores que tienen al menos una estimación publicable. */
export const RESULT_INDICATOR_IDS: string[] = Array.from(new Set(RECORDS.map((r) => r.indicator_id)));
export const hasResults = (id: string) => RESULT_INDICATOR_IDS.includes(id);

/** Entradas de disponibilidad de un indicador, tal como las declara el manifiesto. */
export const availabilityEntries = (id: string) => AVAILABILITY.filter((a) => a.indicator_id === id);

export type IndicatorAvailability = {
  allowed: boolean;
  /** true solo cuando además existen filas en el snapshot publicado. */
  published: boolean;
  status: string | null;
  reason: string;
  entries: AvailabilityEntry[];
};
/** Estado honesto de un indicador: permitido, motivo y si de hecho hay filas. */
export function indicatorAvailability(id: string): IndicatorAvailability {
  const entries = availabilityEntries(id);
  const blocked = entries.filter((e) => !e.allow_results);
  const allowed = entries.length > 0 && blocked.length === 0;
  const source = blocked[0] ?? entries[0];
  return {
    allowed,
    published: allowed && hasResults(id),
    status: source?.status ?? null,
    reason: source?.reason ?? "No hay un registro de disponibilidad para este indicador.",
    entries,
  };
}
/** Celdas concretas cuya precisión el análisis declaró no evaluable. */
export function blockedCells(id: string, sex?: string, age?: string, region?: number) {
  return BLOCKED_CELLS.filter((c) => c.indicator_id === id
    && (sex === undefined || c.sex === sex)
    && (age === undefined || c.age_group === age)
    && (region === undefined || c.region_id === region));
}
/** Procedencia de la derivación de un indicador; null cuando no está declarada. */
export function syntaxSourceOf(id: string): SyntaxSource | null {
  const meta = getIndicator(id);
  return (meta?.syntax_source as SyntaxSource | undefined) ?? null;
}
export const derivedVariable = (name?: string | null) => (name ? DERIVED_VARIABLES[name] : undefined);

/** Recuento por procedencia, para redactar el alcance sin inventar cifras. */
export function syntaxSourceCounts() {
  const out = { oficial: 0, reconstruccion_proyecto: 0, sin_declarar: 0 };
  for (const i of INDICATORS) {
    const s = i.syntax_source;
    if (s === "oficial") out.oficial++;
    else if (s === "reconstruccion_proyecto") out.reconstruccion_proyecto++;
    else out.sin_declarar++;
  }
  return out;
}
/** Indicadores del catálogo que hoy no pueden mostrar cifra, con su motivo. */
export function unavailableIndicators() {
  return INDICATORS.filter((i) => !indicatorAvailability(i.indicator_id).published)
    .map((i) => ({ meta: i, availability: indicatorAvailability(i.indicator_id) }));
}
