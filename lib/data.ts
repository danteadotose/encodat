import estimatesRaw from "@/data/estimates.json";
import indicatorsRaw from "@/data/indicators.json";
import regionsRaw from "@/data/regions.json";
import regionGeoRaw from "@/data/region_geo.json";
import correlationsRaw from "@/data/correlations.json";
import type { EstimateRecord, IndicatorMeta, Region, Sex, AgeGroup, RegionGeo, CorrData, CorrPair } from "./types";

export const RECORDS = (estimatesRaw.records as EstimateRecord[]);
export const DATASET_YEAR = estimatesRaw.year as number;
export const INDICATORS = (indicatorsRaw.indicators as IndicatorMeta[]);
export const CATEGORY_ORDER = ((indicatorsRaw as any).category_order as string[]) ?? [];
export const DATA_SOURCE = indicatorsRaw.source as string;
export const CORR = correlationsRaw as unknown as CorrData;
export const CORR_PAIRS = CORR.pairs as CorrPair[];
export const REGIONS = (regionsRaw.regions as Region[]);
export const REGION_GEO = (regionGeoRaw as unknown as RegionGeo);
export const EXCLUDED = regionsRaw.excluded_entidades as { cve_ent: number; name: string; reason: string }[];
export const REGIONS_NOTE = regionsRaw.note as string;

export const getIndicator = (id: string) => INDICATORS.find((i) => i.indicator_id === id);
export const defaultIndicatorId = () => INDICATORS[0]?.indicator_id;

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
const CSV_COLS: (keyof EstimateRecord)[] = ["year","indicator_id","kind","geo_level","region_id","region_name","sex","age_group","estimate","ci_low","ci_high","se","cv","reliab","n","n_pos","df","pop"];
export function toCSV(rows: EstimateRecord[]): string {
  const head = CSV_COLS.join(",");
  const body = rows.map((r) => CSV_COLS.map((c) => { const v = r[c]; if (v === null || v === undefined) return ""; if (typeof v === "string" && (v.includes(",") || v.includes('"'))) return `"${v.replace(/"/g, '""')}"`; return String(v); }).join(","));
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
