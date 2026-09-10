import Link from "next/link";
import { national, DATASET_YEAR, defaultIndicatorId, query, indicatorsByCategory, getIndicator } from "@/lib/data";
import { regionalExtremes, sexContrast } from "@/lib/narrative";
import { RegionMap } from "@/components/RegionMap";
import { statusDot } from "@/components/ui";
import { intfmt, isMean } from "@/lib/format";

export default function Home() {
  const id = defaultIndicatorId();
  const meta = getIndicator(id)!;
  const nat = national(id, "total", "12-65")!;
  const ext = regionalExtremes(id, "total", "12-65");
  const sc = sexContrast(id, "12-65")!;
  const regionRows = query({ indicator_id: id, sex: "total", age_group: "12-65", geo_level: "region" });
  const groups = indicatorsByCategory();

  return (
    <div className="mx-auto max-w-6xl px-5">
      <section className="home-opening">
        <div><div className="kicker mb-3">Encuesta nacional · México</div><h1 className="font-display font-bold text-ink">Explora los resultados de la ENCODAT {DATASET_YEAR}.</h1><p className="mt-4 text-subink max-w-measure">Consumo de sustancias y salud mental: estimaciones ponderadas, intervalos de confianza y comparaciones por población y región.</p><div className="flex gap-3 flex-wrap mt-5"><Link href="/explorar" className="btn btn-primary">Explorar indicadores</Link><Link href="/metodologia" className="btn btn-secondary">Consultar metodología</Link></div></div>
        <div className="home-feature"><div className="kicker mb-3">Indicador destacado · Nacional</div><h2 className="font-display text-2xl font-semibold">{meta.label}</h2><div className="mt-4 flex items-baseline gap-2"><strong className="text-6xl tnum tracking-tight text-teal-deep">{nat.estimate.toFixed(1)}</strong><span className="text-2xl text-subink">{isMean(meta.unit)?"años":"%"}</span></div><p className="text-sm text-subink mt-3 tnum">IC 95%: {nat.ci_low.toFixed(1)}–{nat.ci_high.toFixed(1)}{isMean(meta.unit)?" años":"%"} · 12 a 65 años</p><p className="text-sm text-faint mt-1">Población base N ≈ {(nat.pop / 1e6).toFixed(1).replace(".", ",")} millones (ponderada)</p><Link href="/explorar" className="btn btn-quiet mt-3">Consultar este indicador →</Link></div>
      </section>
      <section className="py-8 grid lg:grid-cols-[.8fr_1.2fr] gap-8 items-start">
        <div><div className="kicker mb-3">Panorama del indicador destacado</div><h2 className="font-display text-2xl font-semibold">Una mirada por región</h2><p className="text-subink mt-3">{meta.short_label} · {meta.period}. Selecciona una región para consultar su estimación e intervalo.</p><ul className="mt-5 space-y-4 text-sm text-subink"><li>Región más alta: <strong className="text-ink">{ext.top.region_name}</strong> ({ext.top.estimate.toFixed(1)}%); más baja: <strong className="text-ink">{ext.bottom.region_name}</strong> ({ext.bottom.estimate.toFixed(1)}%).</li><li>Hombres {sc.h.estimate.toFixed(1)}% y mujeres {sc.m.estimate.toFixed(1)}%: {Math.abs(sc.diff).toFixed(1)} pp{sc.overlap?" (los IC se traslapan: diferencia descriptiva).":" (los IC no se traslapan)."}</li></ul><Link href="/explorar#panorama-regional" className="btn btn-secondary mt-5">Ver mapa y ranking</Link></div>
        <div className="rounded-2xl border hairline bg-surface p-5 sm:p-6"><RegionMap rows={regionRows} unit={meta.unit} /></div>
      </section>

      <section className="pb-20 border-t hairline pt-12">
        <h2 className="font-display text-[1.7rem] font-bold mb-1.5 text-ink">Explora por tema</h2>
        <p className="text-subink mb-8 max-w-measure text-[15px]">
          Drogas, alcohol y salud mental. Prevalencia nacional ponderada (12–65 años); la edad de inicio es una media en años. El punto indica la validación contra el informe oficial:
          <span className="inline-flex items-center gap-1 ml-1"><span className="inline-block w-2 h-2 rounded-full bg-teal align-middle" /> coincide</span> ·
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber align-middle" /> aproximado</span> ·
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-faint align-middle" /> difiere</span>.
        </p>
        <nav className="flex flex-wrap gap-2 mb-8" aria-label="Temas de indicadores">{groups.map((g,index)=><a className="category-link" key={g.category} href={`#tema-${index}`}>{g.category} <span className="ml-2 text-faint">{g.items.length}</span></a>)}</nav>
        {groups.map((g,index) => (
          <div key={g.category} id={`tema-${index}`} className="mb-9">
            <div className="kicker mb-3.5">{g.category}</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {g.items.map((i) => {
                const r = national(i.indicator_id, "total", "12-65");
                return (
                  <Link key={i.indicator_id} href={`/explorar?ind=${i.indicator_id}`}
                    className="group rounded-xl border hairline bg-surface p-5 hover:bg-teal-wash/30 hover:border-teal-soft/60 transition-soft">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[15px] font-semibold text-ink group-hover:text-teal-deep leading-snug">{i.short_label}</span>
                      <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${statusDot(i.validation_status)}`} title={i.validation_status} />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-display text-[2.1rem] leading-none font-bold tnum text-teal-deep">{r ? r.estimate.toFixed(1) : "—"}</span>
                      <span className="text-subink text-sm">{isMean(i.unit) ? "años" : "%"}</span>
                      {r && <span className="text-faint text-xs tnum ml-auto">IC {r.ci_low.toFixed(1)}–{r.ci_high.toFixed(1)}</span>}
                    </div>
                    <div className="text-xs text-faint mt-1.5">{i.period}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
