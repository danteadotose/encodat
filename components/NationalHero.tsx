import type { EstimateRecord, IndicatorMeta } from "@/lib/types";
import { intfmt, isMean, RELIAB_LABEL, RELIAB_HINT, visibleReliability } from "@/lib/format";
import { Meta } from "./ui";

function millones(n: number) {
  if (n >= 1e6) return `≈ ${(n / 1e6).toFixed(1).replace(".", ",")} millones`;
  if (n >= 1e3) return `≈ ${(n / 1e3).toFixed(0)} mil`;
  return "";
}
export function NationalHero({ rec, meta, scopeLabel }: { rec: EstimateRecord; meta: IndicatorMeta; scopeLabel?: string }) {
  const mean = isMean(meta.unit);
  const suffix = mean ? "años" : "%";
  const axSuf = mean ? " años" : "%";
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const dmax = mean ? Math.max(rec.ci_high * 1.15, rec.estimate + 5) : 100;
  const asPct = (v: number) => `${clamp((v / dmax) * 100)}%`;
  const reliab = visibleReliability(rec.cv, rec.reliab) ?? "desconocida";
  return (
    <section className="national-hero rounded-2xl border hairline bg-surface overflow-hidden">
      <div className="grid md:grid-cols-[1.05fr_1fr]">
        <div className="p-6 sm:p-7">
          <div className="kicker mb-2">{mean ? "Media nacional · ponderada" : "Estimación nacional · ponderada"}</div>
          <div className="flex items-end gap-2">
            <span className="font-display text-[4.2rem] leading-[0.9] font-bold tnum text-teal-deep">{rec.estimate.toFixed(1)}</span>
            <span className="text-3xl text-subink font-display mb-1">{suffix}</span>
          </div>
          <div className="text-subink mt-3 tnum text-[15px]">
            Intervalo de confianza 95%: <span className="text-ink font-medium">{rec.ci_low.toFixed(1)}–{rec.ci_high.toFixed(1)}{mean ? " años" : ""}</span>
          </div>
          {scopeLabel && <div className="text-faint text-sm mt-1">{scopeLabel} · {meta.unit}</div>}
          <div className="mt-6">
            <div className="relative h-2.5 rounded-full bg-teal-wash">
              <div className="absolute h-2.5 rounded-full bg-teal-soft/70" style={{ left: asPct(rec.ci_low), width: `${clamp(((rec.ci_high - rec.ci_low) / dmax) * 100)}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-teal-deep border-2 border-white shadow" style={{ left: asPct(rec.estimate) }} />
            </div>
            <div className="flex justify-between text-xs text-faint tnum mt-1"><span>0{axSuf}</span><span>estimación · IC 95%</span><span>{Math.round(dmax)}{axSuf}</span></div>
          </div>
        </div>
        <div className="border-t md:border-t-0 md:border-l hairline bg-paper/40 p-6 sm:p-7 grid grid-cols-2 gap-x-6 gap-y-5 content-center">
          <Meta label="Población base (N)" value={intfmt(rec.pop)} hint={`ponderada ${millones(rec.pop)}`} />
          <Meta label="Coef. de variación" value={rec.cv === null ? "—" : `${rec.cv.toFixed(1)}%`} hint="menor = más preciso" />
          <Meta label="Confiabilidad" value={<span className={reliab === "baja" ? "text-amber" : reliab === "media" ? "text-amber" : ""}>{RELIAB_LABEL[reliab]?.replace("Confiabilidad ", "") ?? "No disponible"}</span>} hint={RELIAB_HINT[reliab] ?? "Sin clasificación documentada"} />
          <Meta label="Base del indicador" value={<span className="text-sm font-medium">{meta.base_label ?? "Población de 12 a 65 años"}</span>} />
        </div>
      </div>
    </section>
  );
}
