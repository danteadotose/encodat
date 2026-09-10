export const pct = (v: number | null | undefined, d = 1) =>
  v === null || v === undefined ? "—" : `${v.toFixed(d)}%`;

export const num = (v: number | null | undefined, d = 1) =>
  v === null || v === undefined ? "—" : v.toFixed(d);

export const intfmt = (v: number) => new Intl.NumberFormat("es-MX").format(Math.round(v));

export const ci = (lo: number, hi: number, d = 1) => `${lo.toFixed(d)}–${hi.toFixed(d)}`;

export const SEX_LABEL: Record<string, string> = {
  total: "Total", hombres: "Hombres", mujeres: "Mujeres",
};
export const AGE_LABEL: Record<string, string> = {
  "12-65": "12 a 65 años", "12-17": "12 a 17 años (adolescentes)", "18-65": "18 a 65 años (adultos)",
};
export const AGE_SHORT: Record<string, string> = {
  "12-65": "12–65", "12-17": "12–17", "18-65": "18–65",
};

// A "mean" indicator reports años (edad de inicio), not a percentage.
export const isMean = (unitOrKind?: string) =>
  unitOrKind === "mean" || (typeof unitOrKind === "string" && unitOrKind.includes("años"));

// Suffix for a value given an indicator unit ("%" for prevalence, " años" for means).
export const unitSuffix = (unit?: string) => (isMean(unit) ? " años" : "%");

// Format an estimate respecting its unit.
export const fmtVal = (v: number | null | undefined, unit?: string, d = 1) =>
  v === null || v === undefined ? "—" : `${v.toFixed(d)}${isMean(unit) ? " años" : "%"}`;

export const RELIAB_LABEL: Record<string, string> = {
  alta: "Confiabilidad alta", media: "Confiabilidad media", baja: "Confiabilidad baja",
};
export const RELIAB_HINT: Record<string, string> = {
  alta: "CV < 15%", media: "CV 15–30% · interpretar con cautela", baja: "CV ≥ 30% · baja precisión",
};

// A source label cannot establish precision when its CV is missing.
export const visibleReliability = (cv: number | null | undefined, reliability?: string) =>
  cv == null ? undefined : reliability;
