import type { EstimateRecord, IndicatorMeta } from "@/lib/types";
import { isMean, weightedNKind } from "@/lib/format";
import { EstimateValue, WeightedN, SyntaxSourceTag } from "./ui";

/**
 * Referencia nacional de un indicador: estimación, IC 95 %, CV y las dos N
 * ponderadas con su etiqueta. El universo nacional se nombra explícitamente.
 */
export function NationalHero({ rec, meta, scopeLabel }: { rec: EstimateRecord; meta: IndicatorMeta; scopeLabel?: string }) {
  const mean = isMean(meta.unit);
  const suffix = mean ? " años" : "%";
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const dmax = mean ? Math.max(rec.ci_high * 1.15, rec.estimate + 5) : 100;
  const asPct = (v: number) => `${clamp((v / dmax) * 100)}%`;
  const categoryKind = weightedNKind(rec.weighted_n_meaning) ?? "categoria";
  return (
    <section className="national-hero">
      <div className="national-hero-main">
        <span className="kicker">{mean ? "Media nacional · ponderada" : "Estimación nacional · ponderada"}</span>
        <div className="mt-2">
          <EstimateValue
            size="hero" estimate={rec.estimate} ciLow={rec.ci_low} ciHigh={rec.ci_high}
            unit={meta.unit} cv={rec.cv} reliability={rec.reliab}
          />
        </div>
        {scopeLabel && <p className="text-faint text-sm mt-2">{scopeLabel} · {meta.unit} · universo nacional de la encuesta</p>}
        <div className="ci-track" role="img" aria-label={`Intervalo de confianza del 95 %: de ${rec.ci_low.toFixed(1)} a ${rec.ci_high.toFixed(1)}${suffix}, con la estimación en ${rec.estimate.toFixed(1)}${suffix}`}>
          <div className="ci-span" style={{ left: asPct(rec.ci_low), width: `${clamp(((rec.ci_high - rec.ci_low) / dmax) * 100)}%` }} />
          <div className="ci-point" style={{ left: asPct(rec.estimate) }} />
        </div>
        <div className="ci-scale"><span>0{suffix}</span><span>estimación e IC 95 %</span><span>{Math.round(dmax)}{suffix}</span></div>
        <div className="tag-row mt-5">
          <SyntaxSourceTag source={meta.syntax_source ?? null} variable={meta.derived_variable ?? undefined} compact />
          <span className="tag tag-neutral">Base: {meta.base_label ?? meta.population}</span>
        </div>
      </div>
      <div className="national-hero-meta">
        <WeightedN value={rec.weighted_n} kind={categoryKind} />
        <WeightedN value={rec.pop} kind="universo" />
        <div>
          <div className="text-xs font-bold text-subink">Trazabilidad de la cifra</div>
          <div className="text-sm text-ink mt-1">{rec.source_locator ?? "No disponible"}</div>
          <div className="text-xs text-faint mt-1">{rec.evidence_level === "published_point_and_ci" ? "Punto e IC reproducidos contra la publicación." : "Estimación de dominio reproducida por la capa de análisis."}</div>
        </div>
      </div>
    </section>
  );
}
