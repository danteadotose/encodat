import source from "@/data/temporal.json";
import type { ContrastState } from "@/lib/format";

/* ------------------------------------------------------------------ *
 * Capa de datos de la comparación temporal. Propiedad del agente 3.
 * El navegador no recalcula nada: todo viene precalculado y validado
 * por encodat_analysis/temporal/. Aquí sólo se selecciona y se formatea.
 * ------------------------------------------------------------------ */

export const temporal = source;
export type TemporalRecord = (typeof source.records)[number];
export type TemporalPair = (typeof source.pairs)[number];
export type TemporalMatrixRow = (typeof source.matrix)[number];
export type TemporalBlockedCell = (typeof source.blocked_cells)[number];
export type TemporalEdition = (typeof source.editions)[number];

/** Una fila de la selección: el par y sus dos registros de edición ya resueltos. */
export type TemporalRow = {
  pair: TemporalPair;
  earlier: TemporalRecord;
  later: TemporalRecord;
};

export type TemporalSelection = {
  indicator: string;
  category: string;
  region: string;
  sex: string;
  age: string;
};

export const TEMPORAL_AGES = ["12-65", "12-17", "18-65"] as const;
export const TEMPORAL_INDICATOR = "alc_alguna_vez";
export const TEMPORAL_CATEGORY = "Consumo alguna vez en la vida";
export const TEMPORAL_SEX = "total";
export const TEMPORAL_DEFAULTS: TemporalSelection = {
  indicator: TEMPORAL_INDICATOR, category: TEMPORAL_CATEGORY,
  region: "all", sex: TEMPORAL_SEX, age: "12-65",
};

const byId = new Map(source.records.map(row => [row.record_id, row]));
export function getTemporalRecord(id: string): TemporalRecord {
  const row = byId.get(id);
  if (!row) throw new Error("No se encontró el resultado temporal validado.");
  return row;
}

/** Regiones con comparación liberada, en el orden de la fuente. */
export const temporalRegions = Array.from(
  new Map(source.pairs.map(p => [p.region_id, p.region_name])).entries(),
);

/** Ámbitos presentes en la fuente pero bloqueados, con su motivo. */
export const temporalBlockedRegions = Array.from(
  new Map(source.blocked_cells.map(c => [c.region_id, c])).values(),
);

/* ---- estados de contraste: los tres admitidos, y sólo esos ---- */
const STATE_MAP: Record<string, ContrastState> = {
  evidence_of_change: "evidencia",
  insufficient_evidence: "sin_evidencia",
  not_evaluable: "no_evaluable",
};
export function contrastState(status: string): ContrastState {
  return STATE_MAP[status] ?? "no_evaluable";
}

/* ---- selección única que alimenta gráfica, tabla y descarga ---- */
export function validTemporalSelection(s: TemporalSelection) {
  return (
    s.indicator === TEMPORAL_INDICATOR &&
    s.category === TEMPORAL_CATEGORY &&
    s.sex === TEMPORAL_SEX &&
    (TEMPORAL_AGES as readonly string[]).includes(s.age) &&
    (s.region === "all" || temporalRegions.some(([id]) => String(id) === s.region))
  );
}

export function selectTemporalRows(s: TemporalSelection): TemporalRow[] {
  if (!validTemporalSelection(s)) return [];
  return source.pairs
    .filter(p => p.age_group === s.age && (s.region === "all" || String(p.region_id) === s.region))
    .map(pair => ({
      pair,
      earlier: getTemporalRecord(pair.earlier),
      later: getTemporalRecord(pair.later),
    }));
}

/** Simetría del eje de la gráfica de diferencias, a partir de los datos mostrados. */
export function temporalDiffDomain(rows: TemporalRow[]) {
  const values = rows.flatMap(r =>
    [r.pair.difference_pp, r.pair.difference_ci_low, r.pair.difference_ci_high]
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v)));
  if (!values.length) return 5;
  return Math.max(2, Math.ceil(Math.max(...values.map(Math.abs)) + 1));
}

/* ---- URL: conserva los demás filtros al cambiar uno ---- */
export function replaceTemporalFilter(
  key: keyof TemporalSelection, value: string,
  browser: Pick<Window, "location" | "history"> = window,
) {
  const next = new URLSearchParams(browser.location.search);
  next.set(key, value);
  browser.history.replaceState(null, "", `/comparar?${next.toString()}${browser.location.hash}`);
}

export function readTemporalSelection(params: URLSearchParams): TemporalSelection {
  const pick = (k: keyof TemporalSelection) => params.get(k) ?? TEMPORAL_DEFAULTS[k];
  const candidate: TemporalSelection = {
    indicator: pick("indicator"), category: pick("category"),
    region: pick("region"), sex: pick("sex"), age: pick("age"),
  };
  return validTemporalSelection(candidate) ? candidate : TEMPORAL_DEFAULTS;
}

/* ---- descargas: exactamente las filas mostradas ---- */
const csvCell = (value: unknown) =>
  `"${String(value === null || value === undefined ? "No disponible" : value).replace(/"/g, '""')}"`;
const csv = (header: string[], rows: unknown[][]) =>
  "﻿" + [header, ...rows].map(r => r.map(csvCell).join(",")).join("\r\n");

/** Una fila por edición: lo que muestra la figura de las dos ediciones. */
export function temporalEditionsCsv(rows: TemporalRow[]) {
  const header = [
    "indicador", "categoria", "region", "edad", "sexo", "edicion", "trabajo_de_campo",
    "prevalencia_pct", "ic95_inferior_pct", "ic95_superior_pct", "metodo_ic",
    "error_estandar_pp", "origen_varianza", "cv_pct",
    "N_ponderada_categoria", "significado_N_ponderada_categoria",
    "N_ponderada_universo", "significado_N_ponderada_universo",
    "comparabilidad", "precision", "fuente_cuadro", "fuente_pagina", "fuente_url",
  ];
  const fieldwork = new Map(source.editions.map(e => [e.id, e.fieldwork]));
  const body = rows.flatMap(({ pair, earlier, later }) =>
    [earlier, later].map(r => [
      r.indicator_id, r.category, r.region_name, r.age_group, "Total", r.edition,
      fieldwork.get(r.edition), r.estimate, r.ci_low, r.ci_high, r.ci_method,
      r.se, r.variance_source, r.cv,
      r.weighted_n, r.weighted_n_role,
      r.weighted_denominator_n, r.weighted_denominator_n_role,
      pair.comparability, r.precision_note, r.source_table, r.source_page, r.source_url,
    ]));
  return csv(header, body);
}

/** Una fila por comparación: lo que muestra la figura de diferencias. */
export function temporalDiffCsv(rows: TemporalRow[]) {
  const header = [
    "indicador", "categoria", "region", "edad", "sexo",
    "prevalencia_2016_2017_pct", "ic95_2016_2017", "prevalencia_2025_pct", "ic95_2025",
    "diferencia_2025_menos_2016_2017_pp",
    "ic95_diferencia_inferior_pp", "ic95_diferencia_superior_pp",
    "error_estandar_diferencia_pp", "banda_error_estandar_diferencia_pp",
    "p_valor", "p_ajustada_holm", "estado_contraste", "motivo_estado",
    "comparabilidad", "tipo_comparacion", "familia_multiplicidad", "metodo",
  ];
  const body = rows.map(({ pair, earlier, later }) => [
    pair.indicator_id, pair.category, pair.region_name, pair.age_group, "Total",
    earlier.estimate, `${earlier.ci_low}–${earlier.ci_high}`,
    later.estimate, `${later.ci_low}–${later.ci_high}`,
    pair.difference_pp, pair.difference_ci_low, pair.difference_ci_high,
    pair.se_difference_pp, pair.se_difference_band_pp?.join("–"),
    pair.p_value, pair.p_adjusted, TEMPORAL_CONTRAST_LABEL[contrastState(pair.change_status)],
    pair.status_reason, pair.comparability, pair.mode, pair.family, pair.method,
  ]);
  return csv(header, body);
}

/** Matriz de comparabilidad completa, los 68 indicadores evaluados. */
export function temporalMatrixCsv() {
  const header = [
    "indicador_id", "indicador", "clasificacion", "evaluacion_completa", "liberacion",
    "tiene_resultados_2025", "variable_derivada", "procedencia_sintaxis", "etiqueta_oficial",
    "variables_origen", "definicion_2025", "periodo", "universo_2025", "denominador_2025",
    "faltantes", "cobertura", "region", "evidencia", "evidencia_faltante",
  ];
  const body = source.matrix.map(m => [
    m.indicator_id, m.indicator, m.classification, m.assessment_complete, m.release,
    m.has_results_2025, m.derived_variable, m.syntax_source, m.official_label,
    (m.source_variables ?? []).join(" "), m.definition_2025, m.period, m.universe_2025,
    m.denominator_2025, m.missingness, m.coverage, m.region, m.evidence,
    (m.missing_evidence ?? []).join(" | "),
  ]);
  return csv(header, body);
}

export const TEMPORAL_CONTRAST_LABEL: Record<ContrastState, string> = {
  evidencia: "Cambio con evidencia estadística",
  sin_evidencia: "Sin evidencia suficiente de cambio",
  no_evaluable: "Comparación no evaluable",
};

export function downloadTemporalCsv(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
