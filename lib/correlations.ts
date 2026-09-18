import raw from '@/data/correlations_reviewed.json';
import type { SyntaxSource } from './types';

/** Estados de la revisión estructural de un par. */
export type ReviewStatus = 'excluded' | 'definition_pending' | 'candidate';
/** Estado analítico: qué puede hacer la interfaz con el par. */
export type AnalyticalStatus =
  | 'excluded_from_analysis'
  | 'withheld_pending_definition'
  | 'withheld_release_gate'
  | 'eligible_for_calculation'
  | 'available_recomputed_and_verified';

/** Evidencia tipificada. Cada entrada declara su `tipo`; los campos varían por tipo. */
export interface ReviewEvidence { tipo: string; [key: string]: unknown }

export interface ReviewedPair {
  pair_id: string; a: string; b: string; a_label: string; b_label: string;
  a_category: string; b_category: string;
  a_derived_variable: string | null; b_derived_variable: string | null;
  a_syntax_source: SyntaxSource | null; b_syntax_source: SyntaxSource | null;
  status: ReviewStatus;
  /** Motivo tipificado de la decisión. Nunca depende de la magnitud de la asociación. */
  reason_code: string;
  /** Enunciado general del tipo de dependencia. */
  reason_family: string;
  /** Motivo concreto de este par. */
  reason: string;
  evidence: ReviewEvidence[];
  release_gate_blocked_indicators: string[];
  release_gate_reason: string | null;
  before_present: boolean; before_flagged_redundant: boolean | null;
  analytical_status: AnalyticalStatus;
}

export interface CorrelationResult {
  pair_id: string; a: string; b: string; a_label: string; b_label: string;
  status: string; analytical_status: AnalyticalStatus;
  reason_code: string; reason: string;
  phi: number | null; phi_se: number | null; phi_ci_low: number | null; phi_ci_high: number | null;
  odds_ratio: number | null; odds_ratio_ci_low: number | null; odds_ratio_ci_high: number | null;
  prev_joint: number | null; prev_joint_ci_low: number | null; prev_joint_ci_high: number | null;
  prev_joint_cv: number | null; prev_joint_precision: string | null;
  weighted_joint_n: number | null; weighted_denominator_n: number | null;
  weighted_n_meaning: string; weighted_denominator_meaning: string;
  p_raw: number | null; p_holm: number | null;
  warnings: string[];
  release_gate_blocked_indicators: string[]; release_gate_reason: string | null;
  variance_sensitivity: { primary?: string; alternative?: string; same_evidence_classification: boolean; phi_se_alternative: number | null; p_holm_alternative: number | null };
}

export interface CorrelationIndicator {
  id: string; label: string; category: string;
  derived_variable: string | null; official_label: string | null;
  syntax_source: SyntaxSource | null; block: string | null;
  source_variables: string[];
  positive_condition: string[] | null; positive_condition_origin: string;
  release_allowed: boolean;
}

export interface CorrelationData {
  schema_version: string; year: number; status: string;
  analysis_unit: string; analysis_unit_note: string;
  geographic_scope: string; domain: string;
  region_count: number | null; region_count_note: string;
  method: string;
  multiplicity: { method: string; status: string; family?: string; family_size?: number; family_ids?: string[]; reported_pairs?: number; conservative_note?: string; recomputation_error?: number };
  selection_rules: {
    principle: string; evidence_sources: string[];
    reason_codes: Record<string, string>;
    exclusion_codes: string[]; pending_codes: string[];
    not_applicable: { rule: string; status: string; reason: string }[];
  };
  release_gate: {
    source: string; rule: string; allowed_indicators: string[];
    blocked_indicators: Record<string, { allow_results?: boolean; status?: string; reason?: string }>;
  };
  design?: {
    observations: number; strata: number; psus: number; singleton_strata: number; note: string;
    weighted_n_labels: { weighted_joint_n: string; weighted_denominator_n: string };
  };
  indicators: CorrelationIndicator[];
  counts: Record<string, number>;
  reason_code_counts: Record<string, number>;
  pairs: CorrelationResult[];
  review: ReviewedPair[];
  blockers: { id: string; title: string; detail: string; source: string }[];
  sources: { path: string; sha256: string }[];
  limitations: string[];
  calculation_validation?: {
    status: string; declared_conditions_checked: number;
    declared_conditions: { indicator_id: string; mismatches: number; verified: boolean; citation: string }[];
    pairs_recomputed: number; max_errors: Record<string, number>; holm_max_abs_error: number;
    methods: string[]; not_reproduced_here: string[];
  };
}

export const CORRELATIONS = raw as unknown as CorrelationData;

export const REVIEW_STATUS: Record<ReviewStatus, string> = {
  excluded: 'Excluido por construcción',
  definition_pending: 'Definición pendiente',
  candidate: 'Conservado para análisis',
};
export const ANALYTICAL_STATUS: Record<AnalyticalStatus, string> = {
  excluded_from_analysis: 'Fuera de matrices, rankings y exportaciones',
  withheld_pending_definition: 'Retenido hasta resolver su definición',
  withheld_release_gate: 'Sin cifras: indicador no liberado',
  eligible_for_calculation: 'Conservado, cálculo pendiente',
  available_recomputed_and_verified: 'Recalculado y verificado',
};

/** Pares que pueden aparecer en matrices, rankings y exportaciones analíticas. */
export const REPORTABLE = new Set(
  CORRELATIONS.pairs
    .filter((p) => p.analytical_status === 'available_recomputed_and_verified')
    .map((p) => p.pair_id),
);
export const reportablePairs = () =>
  CORRELATIONS.pairs.filter((p) => REPORTABLE.has(p.pair_id));
export const withheldPairs = () =>
  CORRELATIONS.pairs.filter((p) => p.analytical_status === 'withheld_release_gate');
export const exclusions = () => CORRELATIONS.review.filter((r) => r.status === 'excluded');
export const pendingPairs = () => CORRELATIONS.review.filter((r) => r.status === 'definition_pending');

/** Recuento de exclusiones por tipo de dependencia, en orden descendente. */
export function exclusionsByReason(): { code: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of exclusions()) counts.set(r.reason_code, (counts.get(r.reason_code) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([code, count]) => ({ code, count, label: CORRELATIONS.selection_rules.reason_codes[code] ?? code }))
    .sort((a, b) => b.count - a.count);
}
export function pendingByReason(): { code: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of pendingPairs()) counts.set(r.reason_code, (counts.get(r.reason_code) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([code, count]) => ({ code, count, label: CORRELATIONS.selection_rules.reason_codes[code] ?? code }))
    .sort((a, b) => b.count - a.count);
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function matchesPair(
  pair: { a: string; b: string; a_label: string; b_label: string },
  indicator: string, search: string,
) {
  const label = normalize(`${pair.a_label} ${pair.b_label}`);
  return (indicator === 'all' || pair.a === indicator || pair.b === indicator)
    && normalize(search).trim().split(/\s+/).every((t) => label.includes(t));
}

const quote = (v: unknown) => {
  const s = v === null || v === undefined ? 'No disponible' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const RESULT_COLUMNS: (keyof CorrelationResult)[] = [
  'pair_id', 'a', 'b', 'a_label', 'b_label', 'phi', 'phi_ci_low', 'phi_ci_high',
  'odds_ratio', 'odds_ratio_ci_low', 'odds_ratio_ci_high', 'prev_joint', 'prev_joint_ci_low',
  'prev_joint_ci_high', 'prev_joint_cv', 'prev_joint_precision', 'weighted_joint_n',
  'weighted_n_meaning', 'weighted_denominator_n', 'weighted_denominator_meaning',
  'p_raw', 'p_holm', 'status', 'analytical_status',
];

/**
 * Exportación analítica. Rechaza cualquier par excluido, pendiente o retenido por
 * la puerta de liberación: la misma puerta que filtra matrices y rankings.
 */
export function analyticalCSV(rows: CorrelationResult[]) {
  if (rows.some((r) => !REPORTABLE.has(r.pair_id))) {
    throw new Error('La descarga contiene un par excluido, pendiente o sin liberación de resultados.');
  }
  return [RESULT_COLUMNS.join(','), ...rows.map((r) => RESULT_COLUMNS.map((c) => quote(r[c])).join(','))].join('\n');
}

const INDICATOR_INDEX: Record<string, CorrelationIndicator> = Object.fromEntries(
  CORRELATIONS.indicators.map((i) => [i.id, i]),
);

/**
 * Resume una entrada de evidencia en una línea legible, sin inventar nada.
 * La evidencia del grafo viaja como referencia al indicador (que se declara una
 * sola vez en `indicators`) y aquí se resuelve; si el indicador no estuviera,
 * se dice que falta en lugar de rellenarlo.
 */
export function evidenceLine(e: ReviewEvidence): string {
  const g = (k: string) => e[k];
  switch (e.tipo) {
    case 'grafo_de_variables_derivadas': {
      const id = String(g('indicador') ?? '');
      const i = INDICATOR_INDEX[id];
      if (!i) return `Grafo de variables derivadas · ${id || 'indicador no declarado'}: metadatos no disponibles`;
      return `Grafo de variables derivadas · ${i.id} = ${i.derived_variable ?? 'sin variable derivada oficial'}`
        + `${i.official_label ? ` («${i.official_label}»)` : ''}`
        + ` · procedencia ${i.syntax_source ?? 'no declarada'}`
        + ` · variables de origen: ${i.source_variables.join(', ') || 'no declaradas'}`
        + ` · condición positiva: ${i.positive_condition ? i.positive_condition.join(' o ') : 'no expresable'}`
        + ` · origen: ${i.positive_condition_origin}`;
    }
    case 'implicacion_logica':
      return `Implicación ${g('alcance')}: todo positivo de ${g('implica')} lo es de ${g('implicado')}`
        + ` (${g('demostracion_ramas') ?? (g('demostracion') as unknown[] | undefined)?.length ?? 0} ramas demostradas)`;
    case 'salto_del_cuestionario_verificado':
      return `Saltos del cuestionario verificados con 0 contraejemplos: `
        + ((g('saltos') as { salto: string }[] | undefined)?.map((s) => s.salto).join(', ') || 'ninguno');
    case 'salto_comun_verificado':
      return `Condición impuesta en común por un salto: ${Object.entries((g('condicion_compartida') ?? {}) as Record<string, string>)
        .map(([c, v]) => `${c} en {${v}}`).join(' y ')}`;
    case 'anidamiento_bloqueado_por_edad_de_inicio': {
      const afectadas = (g('sustancias_afectadas') ?? []) as { sustancia: string; contraejemplos: number }[];
      const revisadas = (g('sustancias_revisadas') ?? []) as string[];
      const total = Number(g('contraejemplos_totales') ?? 0);
      const corroboracion = total > 0
        ? `corroboración: ${total} ${total === 1 ? 'persona rompe' : 'personas rompen'} la contención en `
          + afectadas.map((x) => `${x.sustancia} ${x.contraejemplos}`).join(', ')
        : `corroboración: 0 contraejemplos observados en ${revisadas.join(', ')}, lo que no garantiza la contención`;
      return `El indicador de vida exige la confirmación por edad de inicio (${g('regla_de_confirmacion') ?? 'regla no declarada'})`
        + ` y el de último año no la exige, así que la contención no está garantizada por construcción; ${corroboracion}.`;
    }
    case 'aplicacion_a_toda_la_muestra':
      return `Preguntas aplicadas a la muestra completa, sin salto: ${(g('columnas') as string[] | undefined)?.join(', ')}`;
    case 'universo_no_demostrado':
      return String(g('detalle') ?? 'Universo no demostrado');
    case 'condicion_no_declarada':
      return `Condición positiva no expresable: ${g('detalle')}`;
    default:
      return `${e.tipo}: ${JSON.stringify(e)}`;
  }
}

const REVIEW_COLUMNS = [
  'pair_id', 'indicador_a', 'indicador_b', 'variable_derivada_a', 'variable_derivada_b',
  'estado', 'estado_analitico', 'motivo_tipificado', 'tipo_de_dependencia', 'motivo',
  'evidencia', 'indicadores_sin_liberacion', 'motivo_de_la_puerta',
];
/** Registro descargable de la revisión: estado, motivo tipificado y evidencia. */
export function reviewCSV(rows: ReviewedPair[]) {
  return [
    REVIEW_COLUMNS.join(','),
    ...rows.map((r) => [
      r.pair_id, r.a, r.b, r.a_derived_variable, r.b_derived_variable,
      REVIEW_STATUS[r.status], ANALYTICAL_STATUS[r.analytical_status],
      r.reason_code, r.reason_family, r.reason,
      r.evidence.map(evidenceLine).join(' | '),
      r.release_gate_blocked_indicators.join(' '), r.release_gate_reason,
    ].map(quote).join(',')),
  ].join('\n');
}

export function downloadCorrelationCSV(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Enunciado de evidencia estadística. Los tres estados permitidos y nada más.
 * Nunca se deduce del solapamiento de intervalos ni de la magnitud de phi.
 */
export function evidenceLabel(r: CorrelationResult): 'evidencia' | 'sin_evidencia' | 'no_evaluable' {
  if (!r.variance_sensitivity?.same_evidence_classification) return 'no_evaluable';
  if (r.p_holm == null) return 'no_evaluable';
  return r.p_holm < 0.05 ? 'evidencia' : 'sin_evidencia';
}
export const EVIDENCE_LABEL: Record<'evidencia' | 'sin_evidencia' | 'no_evaluable', string> = {
  evidencia: 'Asociación con evidencia estadística',
  sin_evidencia: 'Sin evidencia suficiente de asociación',
  no_evaluable: 'Asociación no evaluable',
};
