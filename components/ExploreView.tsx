"use client";
import { useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Sex, AgeGroup } from "@/lib/types";
import {
  getIndicator, national, query, availableSexes, availableAges, defaultIndicatorId,
  REGIONS, indicatorAvailability, blockedCells, derivedVariable,
} from "@/lib/data";
import { SEX_LABEL, AGE_LABEL, AGE_SHORT, isMean, SYNTAX_SOURCE_LABEL } from "@/lib/format";
import { RangePlot } from "./RangePlot";
import { RegionMap } from "./RegionMap";
import { NationalHero } from "./NationalHero";
import { DataTable } from "./DataTable";
import { DownloadBar } from "./DownloadBar";
import { ClientReady, IndicatorPicker, ShareView, ReadingGuide } from "./Controls";
import {
  ReportSection, FigureCard, Availability, MethodDisclosure, FilterBar, SyntaxSourceTag,
  type FilterGroup,
} from "./Report";
import { EstimateFigure } from "./EstimateFigure";
import { NATIONAL_INK, DATA_INK } from "@/lib/scale";

export function ExploreView() {
  const pathname = usePathname(), sp = useSearchParams();
  const indId = getIndicator(sp.get("ind") ?? "")?.indicator_id ?? defaultIndicatorId(), meta = getIndicator(indId)!;
  const actualSexes = availableSexes(indId), actualAges = availableAges(indId);
  const sexes: Sex[] = ["total", "hombres", "mujeres"], ages: AgeGroup[] = ["12-65", "12-17", "18-65"];
  const sex: Sex = (actualSexes.length ? actualSexes : sexes).includes(sp.get("sex") as Sex) ? sp.get("sex") as Sex : (actualSexes[0] ?? "total");
  const age: AgeGroup = (actualAges.length ? actualAges : ages).includes(sp.get("age") as AgeGroup) ? sp.get("age") as AgeGroup : (actualAges[0] ?? "12-65");
  const focus = REGIONS.some(r => String(r.region_id) === sp.get("region")) ? Number(sp.get("region")) : undefined;

  const availability = indicatorAvailability(indId);
  const hero = national(indId, sex, age);
  const regionRows = query({ indicator_id: indId, sex, age_group: age, geo_level: "region", region_id: focus }).slice().sort((a, b) => b.estimate - a.estimate);
  const rows = [...(hero ? [hero] : []), ...regionRows], showTable = sp.get("tabla") === "1";
  const setParam = useCallback((patch: Record<string, string | null>) => {
    const p = new URLSearchParams(window.location.search);
    Object.entries(patch).forEach(([k, v]) => v === null ? p.delete(k) : p.set(k, v));
    window.history.replaceState(null, "", `${pathname}?${p}`);
  }, [pathname]);
  const selectRegion = (id: number) => setParam({ region: focus === id ? null : String(id) });
  const scope = `${SEX_LABEL[sex]} · ${AGE_LABEL[age]}`, valueWord = isMean(meta.unit) ? "Media" : "Prevalencia";
  const sexRows = (actualSexes.length ? actualSexes : []).flatMap(s => { const r = national(indId, s, age); return r ? [r] : []; });
  const ageRows = (actualAges.length ? actualAges : []).flatMap(a => { const r = national(indId, sex, a); return r ? [r] : []; });
  const blocked = blockedCells(indId, sex, age, focus);
  const filename = `encodat2025_${indId}_${sex}_${age}_${focus ?? "regiones"}.csv`;
  const link = new URLSearchParams({ ind: indId, sex, age, ...(focus ? { region: String(focus) } : {}), ...(showTable ? { tabla: "1" } : {}) });
  const invalid = (sp.has("ind") && sp.get("ind") !== indId) || (sp.has("sex") && sp.get("sex") !== sex) || (sp.has("age") && sp.get("age") !== age) || (sp.has("region") && focus === undefined);
  const dv = derivedVariable(meta.derived_variable);

  const noResultsReason = `${availability.reason} Los originales y el método permanecen en la capa de análisis; la interfaz no completa la cifra.`;
  const groups: FilterGroup[] = [
    {
      id: "sexo", label: "Sexo", value: sex, onChange: v => setParam({ sex: v }),
      options: sexes.map(v => ({
        value: v, label: SEX_LABEL[v],
        disabled: !actualSexes.includes(v),
        disabledReason: `No hay resultados publicables para «${SEX_LABEL[v]}» en este indicador. ${availability.reason}`,
      })),
    },
    {
      id: "edad", label: "Edad (años)", value: age, onChange: v => setParam({ age: v }),
      options: ages.map(v => ({
        value: v, label: AGE_SHORT[v], hint: AGE_LABEL[v],
        disabled: !actualAges.includes(v),
        disabledReason: `No hay resultados publicables para el grupo de ${AGE_LABEL[v]} en este indicador. ${availability.reason}`,
      })),
    },
    {
      id: "region", label: "Región", value: focus === undefined ? "" : String(focus),
      control: "select", onChange: v => setParam({ region: v || null }),
      options: [
        { value: "", label: "Todas las regiones" },
        ...REGIONS.map(r => {
          const available = query({ indicator_id: indId, sex, age_group: age, geo_level: "region", region_id: r.region_id }).length > 0;
          return {
            value: String(r.region_id), label: r.name,
            disabled: !available,
            disabledReason: `La región ${r.name} no tiene una estimación publicable para ${scope}. ${availability.reason}`,
          };
        }),
      ],
    },
  ];

  return <div><ClientReady />
    <header className="explore-heading">
      <div>
        <span className="kicker">Consultar · {meta.category}</span>
        <h1 className="font-display mt-2">{meta.label}</h1>
        <p className="report-description mt-3">{meta.period} · {meta.unit} · {meta.base_label ?? meta.population}</p>
        <div className="tag-row mt-3">
          <SyntaxSourceTag source={meta.syntax_source ?? null} variable={meta.derived_variable ?? undefined} compact />
          <span className={availability.published ? "tag tag-official" : "tag tag-project"}>
            <span className="tag-dot" aria-hidden="true" />{availability.published ? "Con resultados publicables" : "Sin resultados publicables"}
          </span>
        </div>
      </div>
      <ShareView href={`${pathname}?${link}`} />
    </header>

    <nav className="report-section-tabs" aria-label="Secciones de este indicador">
      <a href="#estimacion-nacional">Referencia nacional</a>
      <a href="#grupos">Grupos de población</a>
      <a href="#panorama-regional">Regiones, tabla y descarga</a>
      <a href="#fuente-indicador">Definición y fuentes</a>
    </nav>

    <FilterBar
      title="Selección de datos"
      lead={<IndicatorPicker value={indId} onChange={v => setParam({ ind: v, region: null, sex: null, age: null })} />}
      groups={groups}
      onReset={() => window.history.replaceState(null, "", pathname)}
      note="Esta selección alimenta a la vez la gráfica, el mapa, la tabla y la descarga: no hay una segunda fuente de datos en la página."
    />

    {invalid && <Availability state="pendiente" title="Enlace ajustado" reason="La selección que traía el enlace no está disponible en la fuente validada. Se muestran los filtros válidos más próximos, indicados arriba." />}

    {!availability.published && (
      <Availability state="no-disponible" title="Este indicador no muestra cifras" reason={noResultsReason}>
        <p>
          Aparece en el catálogo porque su definición y su variable derivada están documentadas
          ({meta.derived_variable ? <code>{meta.derived_variable}</code> : "sin variable derivada declarada"}
          {meta.syntax_source ? ` · ${SYNTAX_SOURCE_LABEL[meta.syntax_source]}` : ""}), pero no se publica ninguna
          estimación hasta que exista evidencia de validación.
        </p>
      </Availability>
    )}

    <ReportSection id="estimacion-nacional" eyebrow="01 / Referencia" title="Estimación nacional" description={`${scope}. El universo es nacional y no cambia con el filtro de región.`}>
      {hero
        ? <NationalHero rec={hero} meta={meta} scopeLabel={scope} />
        : <Availability state="no-disponible" title="Estimación nacional no disponible" reason={noResultsReason} />}
      <ReadingGuide />
    </ReportSection>

    <ReportSection id="grupos" eyebrow="02 / Población" title="Lectura por sexo y edad" description="Contrastes nacionales descriptivos. Cada figura, su tabla y su descarga comparten exactamente las mismas observaciones.">
      <div className="grid lg:grid-cols-2 gap-5">
        <EstimateFigure number="1" title="Por sexo" description={`${valueWord} nacional · ${AGE_LABEL[age]}`} rows={sexRows} labels={sexRows.map(r => SEX_LABEL[r.sex])} meta={meta} filename={`encodat2025_${indId}_sexo_${age}.csv`} dimensionNote={`Compara sexo con la edad fija en ${AGE_LABEL[age]}.`} />
        <EstimateFigure number="2" title="Por edad" description={`${valueWord} nacional · ${SEX_LABEL[sex]}`} rows={ageRows} labels={ageRows.map(r => AGE_LABEL[r.age_group])} meta={meta} filename={`encodat2025_${indId}_edad_${sex}.csv`} dimensionNote={`Compara grupos de edad con el sexo fijo en ${SEX_LABEL[sex]}.`} />
      </div>
      <p className="report-description mt-4">Una diferencia entre dos puntos, o el solapamiento de sus intervalos, no establece por sí solo que exista o no un cambio: esta vista no realiza contrastes.</p>
    </ReportSection>

    <ReportSection id="panorama-regional" eyebrow="03 / Regiones" title="Panorama regional" description={`${scope}. ${focus ? REGIONS.find(r => r.region_id === focus)?.name : "Las 9 regiones ENCODAT"}.`}>
      <FigureCard
        number="3" title="Distribución regional y referencia nacional"
        description="Puntos e intervalos de confianza del 95 % por región, con la referencia nacional destacada. El mapa y la gráfica muestran las mismas estimaciones."
        view={showTable ? "tabla" : "grafica"} onViewChange={v => setParam({ tabla: v === "tabla" ? "1" : null })}
        viewLabels={{ chart: "Gráfica y mapa", table: "Tabla" }}
        chart={<div>
          {blocked.length > 0 && <Availability state="no-evaluable" title="Precisión no evaluable en algunas celdas">{blocked.map(r => <p key={r.key}>{REGIONS.find(g => g.region_id === r.region_id)?.name ?? "Región"}: {r.reason}</p>)}</Availability>}
          {!regionRows.length && !blocked.length
            ? <Availability state="no-disponible" title="Estimaciones regionales no disponibles" reason={noResultsReason} />
            : <div className="region-layout">
              <RegionMap rows={regionRows} unit={meta.unit} selected={focus} onSelect={selectRegion} />
              <RangePlot
                items={rows.map(r => ({
                  ...r, key: String(r.region_id),
                  label: r.geo_level === "nacional" ? "Nacional (universo nacional)" : r.region_name ?? "Región",
                  emphasis: r.geo_level === "nacional",
                  color: r.geo_level === "nacional" ? NATIONAL_INK : DATA_INK,
                  scopeNote: r.geo_level === "nacional" ? "La referencia nacional conserva su universo nacional aunque se filtre una región." : undefined,
                }))}
                unit={meta.unit} ariaLabel="Comparación por región, con la referencia nacional"
              />
            </div>}
          {focus !== undefined && <button type="button" className="btn btn-secondary mt-4" onClick={() => setParam({ region: null })}>Ver todas las regiones</button>}
          <DownloadBar rows={rows} filename={filename} />
        </div>}
        table={rows.length
          ? <DataTable rows={rows} filename={filename} search={false} selectedRegion={focus} onSelectRegion={selectRegion} />
          : <Availability state="no-disponible" title="Sin filas que tabular" reason={noResultsReason} />}
        notes={<p>La descarga entrega exactamente las filas de esta figura con los filtros actuales. Las diferencias entre regiones son descriptivas: no se deriva significancia de ellas.</p>}
        source={<>Fuente: {rows[0]?.source_locator ?? "No disponible"}.</>}
      />
    </ReportSection>

    <ReportSection id="fuente-indicador" eyebrow="04 / Definición" title="Definición, fuentes y universo analítico">
      <p className="report-prose">{meta.definition}</p>
      <MethodDisclosure
        title="Definición operacional, procedencia y límites"
        definition={<>{meta.definition} <span className="block mt-1">Periodo: {meta.period}. Base: {meta.base_label ?? meta.population}.</span></>}
        method="Las estimaciones provienen de la capa de análisis, con diseño muestral complejo (ponderador, estrato de varianza y UPM). El navegador no recalcula nada."
        derivedVariable={meta.derived_variable ?? null}
        syntaxSource={meta.syntax_source ?? null}
        syntaxNotes={<>{meta.derived_notes ?? dv?.notes ?? null}{meta.official_label ? <span className="block mt-1">Etiqueta oficial de la variable: «{meta.official_label}».</span> : null}</>}
        sourceVariables={meta.source_variables ?? (meta.source_variable ? meta.source_variable.split(/,\s*/) : null)}
        source={<>{hero?.source_locator ?? availability.reason}</>}
      >
        <p>{meta.notes}</p>
        <p>
          La N ponderada del universo analítico es la suma de ponderadores del dominio. La N ponderada de la
          categoría proviene de la tabla fuente cuando está disponible; no se obtiene multiplicando la
          prevalencia por la población, y si falta se declara «No disponible».
        </p>
        <a className="text-link" href="/metodologia">Consultar metodología, derivación y disponibilidad →</a>
      </MethodDisclosure>
    </ReportSection>
  </div>;
}
