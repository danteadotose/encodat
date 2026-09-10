import type { EstimateRecord, Sex, AgeGroup } from "./types";
import { national, query } from "./data";

// CI overlap: a quick, honest descriptive check (NOT a formal significance test).
export function ciOverlap(a: EstimateRecord, b: EstimateRecord): boolean {
  return !(a.ci_high < b.ci_low || b.ci_high < a.ci_low);
}

export function regionalExtremes(id: string, sex: Sex, age: AgeGroup) {
  const rows = query({ indicator_id: id, sex, age_group: age, geo_level: "region" })
    .slice().sort((a, b) => b.estimate - a.estimate);
  return { top: rows[0], bottom: rows[rows.length - 1], all: rows };
}

export function sexContrast(id: string, age: AgeGroup) {
  const h = national(id, "hombres", age);
  const m = national(id, "mujeres", age);
  if (!h || !m) return null;
  return { h, m, diff: h.estimate - m.estimate, overlap: ciOverlap(h, m) };
}
