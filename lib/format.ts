import type { SyntaxSource, WeightedNKind } from "./types";

export const pct = (v: number | null | undefined, d = 1) =>
  v === null || v === undefined ? "—" : `${v.toFixed(d)}%`;

export const num = (v: number | null | undefined, d = 1) =>
  v === null || v === undefined ? "—" : v.toFixed(d);

export const intfmt = (v: number | null | undefined) => v == null || !Number.isFinite(v) ? "No disponible" : new Intl.NumberFormat("es-MX").format(Math.round(v));

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

/* ------------------------------------------------------------------ *
 * Añadido en la ronda 2026-09-17 — etiquetado obligatorio de N y de
 * procedencia de la derivación. Nada de esto deduce valores: solo
 * nombra lo que el dato ya declara, o dice que falta.
 * ------------------------------------------------------------------ */

/** El texto que acompaña a toda N ponderada. La etiqueta no es opcional. */
export const WEIGHTED_N_LABEL: Record<WeightedNKind, string> = {
  categoria: "N ponderada · población estimada de la categoría",
  universo: "N ponderada · población estimada del universo analítico",
};
export const WEIGHTED_N_SHORT: Record<WeightedNKind, string> = {
  categoria: "N ponderada de la categoría",
  universo: "N ponderada del universo analítico",
};
export const WEIGHTED_N_HINT: Record<WeightedNKind, string> = {
  categoria: "Personas que cumplen la definición, expandidas con el ponderador de la encuesta.",
  universo: "Denominador del indicador: población base expandida. No es un número de casos.",
};
/** Motivo estándar cuando la fuente no aporta la N ponderada. Nunca se sustituye por la n muestral. */
export const WEIGHTED_N_MISSING = "La fuente validada no aporta este conteo ponderado; no se deduce del porcentaje.";

/** Traduce el `weighted_n_meaning` del dato al tipo de N que la interfaz debe declarar. */
export function weightedNKind(meaning?: string | null): WeightedNKind | null {
  if (meaning === "estimated_category_population") return "categoria";
  if (meaning === "estimated_universe_population" || meaning === "analytical_universe_population") return "universo";
  return null;
}

export const SYNTAX_SOURCE_LABEL: Record<SyntaxSource, string> = {
  oficial: "Derivación de la sintaxis oficial",
  reconstruccion_proyecto: "Derivación propia del proyecto",
};
export const SYNTAX_SOURCE_SHORT: Record<SyntaxSource, string> = {
  oficial: "Sintaxis oficial",
  reconstruccion_proyecto: "Derivación del proyecto",
};
export const SYNTAX_SOURCE_HINT: Record<SyntaxSource, string> = {
  oficial: "La sentencia que deriva esta variable está literalmente en el texto de sintaxis SPSS oficial aportado.",
  reconstruccion_proyecto: "No está en el texto aportado: definición vigente del proyecto, expuesta con el nombre oficial cuando ese nombre es inequívoco.",
};
export const SYNTAX_SOURCE_UNKNOWN = "Procedencia de la derivación no declarada en la fuente.";

/** Los tres únicos estados admitidos para un contraste (regla 4 de la coordinación). */
export type ContrastState = "evidencia" | "sin_evidencia" | "no_evaluable";
export const CONTRAST_LABEL: Record<ContrastState, string> = {
  evidencia: "Cambio con evidencia estadística",
  sin_evidencia: "Sin evidencia suficiente de cambio",
  no_evaluable: "Comparación no evaluable",
};

/** Diferencia en puntos porcentuales, con signo explícito. */
export const fmtDiff = (v: number | null | undefined, unit?: string, d = 1) => {
  if (v === null || v === undefined || !Number.isFinite(v)) return "No disponible";
  const u = isMean(unit) ? " años" : " pp";
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(d)}${u}`;
};
