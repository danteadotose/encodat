import React from "react";
import type { SyntaxSource, WeightedNKind } from "@/lib/types";
import {
  intfmt, isMean, unitSuffix, visibleReliability, RELIAB_LABEL, RELIAB_HINT,
  WEIGHTED_N_LABEL, WEIGHTED_N_SHORT, WEIGHTED_N_HINT, WEIGHTED_N_MISSING,
  SYNTAX_SOURCE_LABEL, SYNTAX_SOURCE_SHORT, SYNTAX_SOURCE_HINT, SYNTAX_SOURCE_UNKNOWN,
} from "@/lib/format";

/* ================================================================
   Átomos presentacionales. Sin estado y sin manejadores, así que
   sirven igual en un componente de servidor y en uno de cliente.
   Ningún componente de este archivo calcula, deduce ni completa un
   valor ausente: lo declara ausente.
   ================================================================ */

export function SectionHeading({ kicker, title, sub }: { kicker?: string; title: string; sub?: string }) {
  return (
    <div className="mb-5">
      {kicker && <div className="kicker mb-1.5">{kicker}</div>}
      <h2 className="font-display text-[1.6rem] sm:text-[1.8rem] leading-[1.15] font-semibold text-ink">{title}</h2>
      {sub && <p className="text-subink mt-1.5 max-w-measure text-[15px]">{sub}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-md border hairline bg-surface min-w-0 ${className}`}>{children}</section>;
}

export function Meta({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="text-xs tracking-[.01em] text-subink font-bold">{label}</div>
      <div className="tnum font-bold text-ink leading-tight mt-1">{value}</div>
      {hint && <div className="text-xs text-faint leading-snug mt-1">{hint}</div>}
    </div>
  );
}

/* ---------------- procedencia de la derivación ---------------- */

/**
 * Marca de dónde viene la definición operacional de la variable derivada.
 * `oficial` y `reconstruccion_proyecto` se distinguen a la vista, con texto
 * además del color; una procedencia no declarada se dice, no se supone.
 */
export function SyntaxSourceTag({ source, variable, compact = false }:
  { source?: SyntaxSource | null; variable?: string | null; compact?: boolean }) {
  const known = source === "oficial" || source === "reconstruccion_proyecto";
  const cls = source === "oficial" ? "tag tag-official" : source === "reconstruccion_proyecto" ? "tag tag-project" : "tag tag-neutral";
  const label = known ? (compact ? SYNTAX_SOURCE_SHORT[source] : SYNTAX_SOURCE_LABEL[source]) : "Procedencia no declarada";
  return (
    <span className={cls} title={known ? SYNTAX_SOURCE_HINT[source] : SYNTAX_SOURCE_UNKNOWN}>
      <span className="tag-dot" aria-hidden="true" />
      {label}
      {variable && <code className="font-normal">{variable}</code>}
    </span>
  );
}

/* ---------------- estimación con IC y CV ---------------- */

export type EstimateValueSize = "hero" | "lead" | "inline";
/**
 * Estimación puntual con su intervalo de confianza al 95 % y, cuando existe,
 * el coeficiente de variación con su advertencia de precisión. Si falta la
 * estimación se muestra «No disponible» con el motivo; nunca un cero.
 */
export function EstimateValue({
  estimate, ciLow, ciHigh, unit = "%", cv, reliability, size = "lead", digits = 1, missingReason, label,
}: {
  estimate?: number | null; ciLow?: number | null; ciHigh?: number | null;
  unit?: string; cv?: number | null; reliability?: string;
  size?: EstimateValueSize; digits?: number; missingReason?: string; label?: string;
}) {
  const suffix = unitSuffix(unit);
  if (estimate == null || !Number.isFinite(estimate)) {
    return (
      <p className={`estimate-value size-${size}`}>
        <span className="ev-missing">No disponible</span>
        <span className="ev-ci">{missingReason ?? "La fuente validada no aporta esta estimación."}</span>
      </p>
    );
  }
  const shown = visibleReliability(cv, reliability);
  const hasCi = ciLow != null && ciHigh != null && Number.isFinite(ciLow) && Number.isFinite(ciHigh);
  return (
    <div className={`estimate-value size-${size}`}>
      <span className="ev-point">
        {estimate.toFixed(digits)}{isMean(unit) ? " años" : "%"}
      </span>
      <span className="ev-ci">
        {label && <span className="block text-faint">{label}</span>}
        {hasCi
          ? <>IC 95 %: {ciLow!.toFixed(digits)}–{ciHigh!.toFixed(digits)}{suffix}</>
          : <>IC 95 %: No disponible</>}
        <span className="block">
          CV: {cv == null ? "No disponible" : `${cv.toFixed(1)} %`}
          {shown && shown !== "alta" && (
            <> · <span className="precision-flag">{RELIAB_LABEL[shown]} · {RELIAB_HINT[shown]}</span></>
          )}
          {shown === "alta" && <> · {RELIAB_LABEL.alta}</>}
        </span>
      </span>
    </div>
  );
}

/* ---------------- N ponderada, con etiqueta obligatoria ---------------- */

/**
 * N ponderada. `kind` es obligatorio por tipo: toda N mostrada dice si es
 * población estimada de la categoría o población del universo analítico.
 * Cuando el valor falta se muestra «No disponible» con su motivo; nunca se
 * sustituye por la N muestral ni se deduce del porcentaje.
 */
export function WeightedN({ value, kind, hint, missingReason, compact = false }: {
  value: number | null | undefined; kind: WeightedNKind;
  hint?: string; missingReason?: string; compact?: boolean;
}) {
  const missing = value == null || !Number.isFinite(value);
  return (
    <dl className={`weighted-n ${missing ? "is-missing" : ""}`}>
      <dt>{compact ? WEIGHTED_N_SHORT[kind] : WEIGHTED_N_LABEL[kind]}</dt>
      <dd>
        {missing ? "No disponible" : intfmt(value)}
        <span className="wn-hint">{missing ? (missingReason ?? WEIGHTED_N_MISSING) : (hint ?? WEIGHTED_N_HINT[kind])}</span>
      </dd>
    </dl>
  );
}

/** Aviso de universo: la referencia nacional no cambia al filtrar una región. */
export function NationalScopeNote({ className = "" }: { className?: string }) {
  return (
    <p className={`filter-note ${className}`}>
      La referencia nacional conserva su universo nacional aunque se elija una región: no es el promedio de
      las regiones mostradas ni se recalcula con el filtro.
    </p>
  );
}

const VBADGE: Record<string, { c: string; t: string; dot: string }> = {
  coincide: { c: "tag tag-official", t: "Coincide con la cifra oficial", dot: "bg-teal" },
  aproximado: { c: "tag tag-project", t: "Aproximado al publicado", dot: "bg-amber" },
  difiere: { c: "tag tag-neutral", t: "Difiere del publicado", dot: "bg-faint" },
  "sin referencia": { c: "tag tag-neutral", t: "Sin referencia oficial", dot: "bg-faint" },
};
export function ValidationBadge({ status, computed, official, diff, unit }:
  { status?: string; computed?: number | null; official?: number | null; diff?: number | null; unit?: string }) {
  if (!status) return null;
  const s = VBADGE[status] ?? VBADGE["sin referencia"];
  const mean = typeof unit === "string" && unit.includes("años");
  const u = mean ? " años" : "%";
  const du = mean ? " años" : " pp";
  const tip = official != null && computed != null ? `Nacional 12–65: calculado ${computed}${u} · oficial ${official}${u} (Δ ${diff}${du})` : "";
  return (
    <span title={tip} className={s.c}>
      <span className="tag-dot" aria-hidden="true" />
      {s.t}
      {official != null && computed != null && <span className="tnum font-normal">· {computed}{u} vs {official}{u}</span>}
    </span>
  );
}
export function statusDot(status?: string) { return (VBADGE[status ?? "sin referencia"] ?? VBADGE["sin referencia"]).dot; }

/* ---------------- estado de disponibilidad ---------------- */

export type AvailabilityState = "disponible" | "no-disponible" | "no-evaluable" | "pendiente" | "cargando";
const AVAIL_DEFAULT: Record<AvailabilityState, string> = {
  disponible: "Resultado disponible",
  "no-disponible": "Resultado no disponible",
  "no-evaluable": "Comparación no evaluable",
  pendiente: "Pendiente de evidencia",
  cargando: "Cargando resultados",
};
/**
 * Estado honesto de una consulta. El motivo es visible, no un tooltip, y el
 * estado se distingue por texto y por borde, no solo por color.
 */
export function Availability({ state = "no-disponible", title, reason, children, className = "" }: {
  state?: AvailabilityState; title?: string; reason?: string;
  children?: React.ReactNode; className?: string;
}) {
  return (
    <div className={`report-availability state-${state} ${className}`} role={state === "cargando" ? "status" : "note"} aria-live={state === "cargando" ? "polite" : undefined}>
      <span className="availability-symbol" aria-hidden="true">i</span>
      <div>
        <strong>{title ?? AVAIL_DEFAULT[state]}</strong>
        {reason && <span className="availability-reason">{reason}</span>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
