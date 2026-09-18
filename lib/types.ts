export type Sex = "total" | "hombres" | "mujeres";
export type AgeGroup = "12-65" | "12-17" | "18-65";
export type GeoLevel = "nacional" | "region";

/** Procedencia de la derivación de la variable, según la SINTAXIS oficial. */
export type SyntaxSource = "oficial" | "reconstruccion_proyecto";
/** Qué población cuenta una N ponderada. No admite valor por omisión. */
export type WeightedNKind = "categoria" | "universo";

export interface EstimateRecord {
  year: number; indicator_id: string; geo_level: GeoLevel;
  region_id: number; region_name: string | null;
  sex: Sex; age_group: AgeGroup; kind?: "prop" | "mean";
  estimate: number; ci_low: number; ci_high: number; se: number; cv: number | null;
  weighted_n?: number | null; weighted_n_meaning?: string | null; source_locator?: string; evidence_level?: string;
  reliab?: string; n?: number; n_pos?: number | null; sd?: number; deff?: number | null; df: number; pop: number | null;
}
export interface IndicatorMeta {
  indicator_id: string; label: string; short_label: string; category: string;
  definition: string; period: string; unit: string; population: string;
  source_variable: string; notes: string; kind?: "prop" | "mean"; base_label?: string;
  official_national?: number | null; computed_national?: number | null;
  validation_diff?: number | null; validation_status?: string;
  validation_maxdiff?: number | null; n_targets?: number;
  // Añadido en la ronda 2026-09-17 (Ola A): procedencia de la variable derivada.
  derived_variable?: string | null; syntax_source?: SyntaxSource | null;
  source_variables?: string[] | null; official_label?: string | null;
  derived_notes?: string | null; target_source?: string | null;
  depends_on_reconstruction?: boolean | null; incomplete_in_source?: boolean | null;
  alias_oficial?: string | null;
}
/** Metadatos de una de las 89 variables derivadas publicadas en indicators.json. */
export interface DerivedVariableMeta {
  derived_variable: string; official_label?: string | null; source_variables?: string[] | null;
  syntax_source: SyntaxSource; block?: string | null; notes?: string | null;
  depends_on_reconstruction?: boolean | null; incomplete_in_source?: boolean | null;
  alias_oficial?: string | null;
}
/** Una entrada de disponibilidad de release_manifest.json. */
export interface AvailabilityEntry {
  indicator_id: string; geo_level: GeoLevel; region_ids: number[];
  sexes: Sex[]; age_groups: AgeGroup[];
  allow_results: boolean; status: string; reason: string;
  legacy_validation_status?: string | null; legacy_national_diff?: number | null;
  legacy_max_target_diff?: number | null;
  derived_variable?: string | null; syntax_source?: SyntaxSource | null;
  official_label?: string | null; source_variables?: string[] | null;
}
/** Una celda concreta bloqueada por precisión no evaluable. */
export interface BlockedCell {
  key: string; indicator_id: string; geo_level: GeoLevel; region_id: number;
  sex: Sex; age_group: AgeGroup; validation_status: string;
  allow_results: boolean; reason: string;
}
export interface CorrPair {
  a: string; b: string; a_label: string; b_label: string; a_cat: string; b_cat: string;
  phi: number; phi_se: number; z: number; p: number; odds_ratio: number | null;
  prev_a: number; prev_b: number; prev_joint: number; lift: number | null;
  p_b_given_a: number | null; p_a_given_b: number | null; n11: number; redundante: boolean;
}
export interface CorrData {
  year: number; method: string; n_bootstrap: number; min_n11: number; domain: string;
  indicators: { id: string; label: string; category: string }[]; pairs: CorrPair[];
}
export interface Entidad { cve_ent: number; name: string; }
export interface Region { region_id: number; name: string; entidades: Entidad[]; }
export interface RegionGeoState { cve_ent: number; name: string; region_id: number; region_name: string; d: string; }
export interface RegionGeoLabel { region_id: number; name: string; cx: number; cy: number; }
export interface RegionGeo { width: number; height: number; source?: string; states: RegionGeoState[]; regions: RegionGeoLabel[]; }
