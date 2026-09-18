"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  ReportSection, FigureCard, Availability, MethodDisclosure, EstimateValue, WeightedN,
  FilterBar, DiffPlot, SyntaxSourceTag, NationalScopeNote,
} from "@/components/Report";
import { CONTRAST_LABEL, fmtDiff, fmtVal, weightedNKind } from "@/lib/format";
import {
  temporal, selectTemporalRows, temporalDiffDomain, temporalRegions, temporalBlockedRegions,
  contrastState, readTemporalSelection, replaceTemporalFilter, temporalEditionsCsv,
  temporalDiffCsv, temporalMatrixCsv, downloadTemporalCsv, TEMPORAL_AGES, TEMPORAL_INDICATOR,
  TEMPORAL_CATEGORY, TEMPORAL_SEX, type TemporalRow, type TemporalSelection,
} from "@/lib/temporal";

const EDITION_LABEL: Record<string, string> = { "2016-2017": "2016–2017", "2025": "2025" };
const nf = new Intl.NumberFormat("es-MX");

/* ------------------------------------------------------------------ *
 * Gráfica de las dos ediciones. Cada región es una fila con dos
 * intervalos: la posición es el porcentaje y la barra el IC 95 %.
 * El color no es el único portador: cada punto imprime su cifra.
 * ------------------------------------------------------------------ */
function EditionsChart({ rows }: { rows: TemporalRow[] }) {
  const lo = Math.max(0, Math.floor(Math.min(...rows.flatMap(r => [r.earlier.ci_low, r.later.ci_low])) - 4));
  const hi = Math.min(100, Math.ceil(Math.max(...rows.flatMap(r => [r.earlier.ci_high, r.later.ci_high])) + 4));
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
  const rowH = 74, padTop = 26, padBottom = 34, left = 152, right = 78;
  const width = 860, height = padTop + rows.length * rowH + padBottom;
  const x = (v: number) => left + ((v - lo) / (hi - lo)) * (width - left - right);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}
        role="group" aria-label="Prevalencia por edición e intervalo de confianza del 95 %"
        className="min-w-[640px]">
        {ticks.map(t => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={padTop - 8} y2={height - padBottom}
              stroke="currentColor" strokeOpacity="0.14" />
            <text x={x(t)} y={height - padBottom + 18} textAnchor="middle"
              fontSize="12" fill="currentColor" fillOpacity="0.62">{t.toFixed(0)}%</text>
          </g>
        ))}
        {rows.map((row, i) => {
          const y0 = padTop + i * rowH;
          return (
            <g key={row.pair.comparison_id}>
              {i > 0 && <line x1={0} x2={width} y1={y0 - 6} y2={y0 - 6}
                stroke="currentColor" strokeOpacity="0.08" />}
              <text x={0} y={y0 + 14} fontSize="13" fontWeight={600} fill="currentColor">
                {row.pair.region_name}
              </text>
              {[row.earlier, row.later].map((rec, k) => {
                const y = y0 + 34 + k * 24;
                const isNew = k === 1;
                return (
                  <g key={rec.record_id}>
                    <title>{`${EDITION_LABEL[rec.edition]}: ${fmtVal(rec.estimate)} (IC 95 % ${rec.ci_low}–${rec.ci_high})`}</title>
                    <line x1={x(rec.ci_low)} x2={x(rec.ci_high)} y1={y} y2={y}
                      stroke="currentColor" strokeOpacity={isNew ? 0.85 : 0.4}
                      strokeWidth={isNew ? 3 : 3} strokeLinecap="round" />
                    <line x1={x(rec.ci_low)} x2={x(rec.ci_low)} y1={y - 5} y2={y + 5}
                      stroke="currentColor" strokeOpacity={isNew ? 0.85 : 0.4} strokeWidth={1.5} />
                    <line x1={x(rec.ci_high)} x2={x(rec.ci_high)} y1={y - 5} y2={y + 5}
                      stroke="currentColor" strokeOpacity={isNew ? 0.85 : 0.4} strokeWidth={1.5} />
                    <circle cx={x(rec.estimate)} cy={y} r={isNew ? 6 : 5}
                      fill={isNew ? "currentColor" : "var(--surface, #fff)"}
                      stroke="currentColor" strokeWidth={2} />
                    <text x={width - right + 10} y={y + 4} fontSize="12" fill="currentColor"
                      fillOpacity={isNew ? 0.95 : 0.66} fontWeight={isNew ? 600 : 400}>
                      {rec.estimate.toFixed(1)}%
                    </text>
                    <text x={12} y={y + 4} fontSize="11" fill="currentColor" fillOpacity="0.6">
                      {EDITION_LABEL[rec.edition]}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function EditionsLegend() {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <li className="flex items-center gap-2">
        <svg width="34" height="12" aria-hidden="true"><line x1="2" x2="32" y1="6" y2="6"
          stroke="currentColor" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" />
          <circle cx="17" cy="6" r="5" fill="var(--surface, #fff)" stroke="currentColor" strokeWidth="2" /></svg>
        Edición 2016–2017 (campo: junio a octubre de 2016)
      </li>
      <li className="flex items-center gap-2">
        <svg width="34" height="12" aria-hidden="true"><line x1="2" x2="32" y1="6" y2="6"
          stroke="currentColor" strokeOpacity="0.85" strokeWidth="3" strokeLinecap="round" />
          <circle cx="17" cy="6" r="6" fill="currentColor" stroke="currentColor" strokeWidth="2" /></svg>
        Edición 2025 (campo: julio a octubre de 2025)
      </li>
      <li>La barra es el intervalo de confianza del 95 %; el punto, la estimación.</li>
    </ul>
  );
}

/* DiffPlot muestra el estado del contraste en su etiqueta accesible y en el detalle que
 * se abre al activar una fila, pero no en la fila plegada. Para que los tres estados sean
 * visibles sin interactuar, se listan aquí, junto a la gráfica y sobre los mismos datos.
 * No se edita el componente compartido. */
const STATE_STYLE: Record<string, string> = {
  evidencia: "border-current/45 font-semibold",
  sin_evidencia: "border-current/20",
  no_evaluable: "border-current/20 border-dashed",
};

function ContrastStateList({ rows }: { rows: TemporalRow[] }) {
  const groups = (["evidencia", "sin_evidencia", "no_evaluable"] as const)
    .map(state => ({ state, items: rows.filter(r => contrastState(r.pair.change_status) === state) }))
    .filter(g => g.items.length > 0);
  return (
    <div className="mt-6 border-t border-current/10 pt-5">
      <h4 className="text-xs font-semibold uppercase tracking-wide opacity-70">
        Estado del contraste, región por región
      </h4>
      <div className="mt-3 space-y-4">
        {groups.map(({ state, items }) => (
          <div key={state}>
            <p className="text-sm font-medium">
              {CONTRAST_LABEL[state]} <span className="opacity-60">({items.length})</span>
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {items.map(({ pair }) => (
                <li key={pair.comparison_id}
                  className={`rounded-md border px-2.5 py-1.5 text-sm ${STATE_STYLE[state]}`}>
                  <span>{pair.region_name}</span>
                  <span className="ml-2 tabular-nums opacity-75">{fmtDiff(pair.difference_pp, "%")}</span>
                </li>
              ))}
            </ul>
            {state === "no_evaluable" && (
              <ul className="mt-2 space-y-1 text-xs opacity-75">
                {items.map(({ pair }) => (
                  <li key={pair.comparison_id}>{pair.region_name}: {pair.status_reason}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs opacity-70">
        «{CONTRAST_LABEL.sin_evidencia}» no significa que las prevalencias sean iguales, y
        «{CONTRAST_LABEL.no_evaluable}» no significa que no haya cambio: significa que la
        evidencia disponible no permite clasificarlo.
      </p>
    </div>
  );
}

/* ---------------------------- tablas ---------------------------- */
const TH = "px-3 py-2 text-left align-bottom text-xs font-semibold uppercase tracking-wide opacity-70";
const TD = "px-3 py-2.5 align-top text-sm";

function EditionsTable({ rows }: { rows: TemporalRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <caption className="sr-only">
          Prevalencia de consumo de alcohol alguna vez por región y edición, con intervalo de
          confianza del 95 %, N ponderada de la categoría y N ponderada del universo analítico.
        </caption>
        <thead>
          <tr className="border-b-2 border-current/20">
            <th scope="col" className={TH}>Región</th>
            <th scope="col" className={TH}>Edición</th>
            <th scope="col" className={TH}>Prevalencia e IC 95 %</th>
            <th scope="col" className={TH}>N ponderada</th>
            <th scope="col" className={TH}>Varianza</th>
          </tr>
        </thead>
        <tbody>
          {rows.flatMap(row => [row.earlier, row.later].map((rec, k) => (
            <tr key={rec.record_id} className={k === 0 ? "border-t border-current/10" : ""}>
              {k === 0 && <th scope="rowgroup" rowSpan={2} className={`${TD} font-semibold`}>
                {row.pair.region_name}
              </th>}
              <td className={TD}>{EDITION_LABEL[rec.edition]}</td>
              <td className={TD}>
                <EstimateValue estimate={rec.estimate} ciLow={rec.ci_low} ciHigh={rec.ci_high}
                  unit="%" cv={rec.cv} size="inline" />
              </td>
              <td className={TD}>
                <div className="space-y-1">
                  <WeightedN value={rec.weighted_n} compact
                    kind={weightedNKind("estimated_category_population") ?? "categoria"} />
                  <WeightedN value={rec.weighted_denominator_n} kind="universo" compact />
                </div>
              </td>
              <td className={`${TD} max-w-[15rem] text-xs opacity-75`}>
                {rec.variance_source === "design"
                  ? "Exacta, por diseño de la encuesta."
                  : "Reconstruida del IC publicado."}
                {" "}EE {rec.se === null ? "No disponible" : `${rec.se.toFixed(3)} pp`}.
              </td>
            </tr>
          )))}
        </tbody>
      </table>
    </div>
  );
}

function DiffTable({ rows }: { rows: TemporalRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <caption className="sr-only">
          Diferencia en puntos porcentuales de 2025 menos 2016–2017, con intervalo de confianza
          del 95 %, p ajustada por Holm y estado del contraste.
        </caption>
        <thead>
          <tr className="border-b-2 border-current/20">
            <th scope="col" className={TH}>Región</th>
            <th scope="col" className={TH}>2016–2017</th>
            <th scope="col" className={TH}>2025</th>
            <th scope="col" className={TH}>Diferencia e IC 95 %</th>
            <th scope="col" className={TH}>p ajustada (Holm)</th>
            <th scope="col" className={TH}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ pair, earlier, later }) => {
            const state = contrastState(pair.change_status);
            return (
              <tr key={pair.comparison_id} className="border-t border-current/10">
                <th scope="row" className={`${TD} font-semibold`}>{pair.region_name}</th>
                <td className={TD}>{fmtVal(earlier.estimate)}</td>
                <td className={TD}>{fmtVal(later.estimate)}</td>
                <td className={`${TD} whitespace-nowrap`}>
                  <span className="font-semibold">{fmtDiff(pair.difference_pp, "%")}</span>
                  <span className="block text-xs opacity-70">
                    IC 95 % {pair.difference_ci_low === null ? "No disponible"
                      : `${pair.difference_ci_low.toFixed(1)} a ${pair.difference_ci_high?.toFixed(1)} pp`}
                  </span>
                </td>
                <td className={TD}>
                  {pair.p_adjusted === null ? "No disponible"
                    : pair.p_adjusted < 0.001 ? "< 0.001" : pair.p_adjusted.toFixed(3)}
                </td>
                <td className={`${TD} max-w-[18rem]`}>
                  <span className="font-medium">{CONTRAST_LABEL[state]}</span>
                  <span className="block text-xs opacity-70">{pair.status_reason}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MatrixTable() {
  const order = ["comparable", "comparable tras armonizacion", "no comparable"];
  const sorted = [...temporal.matrix].sort(
    (a, b) => order.indexOf(a.classification) - order.indexOf(b.classification)
      || a.indicator.localeCompare(b.indicator, "es"));
  return (
    <div className="max-h-[32rem] overflow-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <caption className="sr-only">
          Clasificación de comparabilidad de los {temporal.matrix.length} indicadores evaluados.
        </caption>
        <thead className="sticky top-0 bg-[var(--surface,#fff)]">
          <tr className="border-b-2 border-current/20">
            <th scope="col" className={TH}>Indicador</th>
            <th scope="col" className={TH}>Clasificación</th>
            <th scope="col" className={TH}>Procedencia de la definición 2025</th>
            <th scope="col" className={TH}>Evidencia que falta</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(m => (
            <tr key={m.indicator_id} className="border-t border-current/10">
              <th scope="row" className={`${TD} font-medium`}>{m.indicator}</th>
              <td className={TD}>
                {m.classification === "no comparable" ? "No comparable" : "Comparable tras armonización"}
                {!m.assessment_complete && (
                  <span className="block text-xs opacity-70">
                    No habilitado con la evidencia revisada; no es una incompatibilidad demostrada.
                  </span>
                )}
              </td>
              <td className={TD}>
                <SyntaxSourceTag source={m.syntax_source as never} variable={m.derived_variable} compact />
              </td>
              <td className={`${TD} max-w-[24rem] text-xs opacity-80`}>
                <ul className="list-disc space-y-0.5 pl-4">
                  {(m.missing_evidence ?? []).map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* FilterBar revela el motivo de una opción deshabilitada cuando se activa, pero una
 * <option disabled> de un <select> no es activable: en los grupos de lista larga
 * (indicador, categoría, región) ese motivo quedaría inalcanzable. Se publica aquí,
 * visible y sin necesidad de interactuar. No se edita el componente compartido. */
function DisabledReasons({ blockedRegionReason }: { blockedRegionReason: string }) {
  const items = [
    ["Indicador", `${temporal.matrix.filter(m => m.release === "not_released").length} de ${temporal.matrix.length} indicadores están deshabilitados: no se ha demostrado que su pregunta, categorías, universo y derivación sean equivalentes entre ediciones. El motivo de cada uno está en la matriz de comparabilidad, al final de esta página.`],
    ["Categoría", "Consumo en el último año y en el último mes están deshabilitados: AL4 cambia de Sí/No a frecuencias y la definición de 2025 del último mes combina más preguntas que la implementación actual."],
    ["Región", blockedRegionReason],
    ["Sexo", "Hombres y mujeres están deshabilitados: no hay resultados publicados por región y sexo en ambas ediciones, y DS2 cambia de sexo del entrevistado (2016–2017) a sexo asignado al nacer (2025)."],
  ] as const;
  return (
    <details className="mt-4 rounded-md border border-current/15 p-3">
      <summary className="cursor-pointer text-sm font-semibold">
        Por qué hay opciones deshabilitadas
      </summary>
      <dl className="mt-3 space-y-3 text-sm">
        {items.map(([label, reason]) => (
          <div key={label}>
            <dt className="font-medium">{label}</dt>
            <dd className="opacity-80">{reason}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs opacity-70">
        Una opción deshabilitada se queda a la vista a propósito: la ausencia de un dato es
        parte del resultado, no se esconde.
      </p>
    </details>
  );
}

/* ------------------------------ sección ------------------------------ */
export function TemporalComparison() {
  const params = useSearchParams();
  const selection = useMemo(
    () => readTemporalSelection(new URLSearchParams(params?.toString() ?? "")),
    [params]);
  const rows = useMemo(() => selectTemporalRows(selection), [selection]);
  const summary = temporal.summary;
  const inference = temporal.inference;
  const alcohol = temporal.matrix.find(m => m.indicator_id === TEMPORAL_INDICATOR)!;
  const coverageReason = temporalBlockedRegions[0]?.reason ?? "";

  const set = (key: keyof TemporalSelection) => (value: string) => {
    replaceTemporalFilter(key, value);
    // La URL es la fuente de verdad de la selección; Next vuelve a renderizar con ella.
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const indicatorOptions = temporal.matrix.map(m => ({
    value: m.indicator_id,
    label: m.indicator,
    disabled: m.release === "not_released",
    disabledReason: m.release === "not_released"
      ? `Sin comparación liberada. ${m.evidence}`
      : undefined,
  }));

  const regionOptions = [
    { value: "all", label: "Las ocho regiones comparables" },
    ...temporalRegions.map(([id, name]) => ({ value: String(id), label: name })),
    ...temporalBlockedRegions.map(c => ({
      value: `blocked-${c.region_id}`, label: c.region_name,
      disabled: true, disabledReason: c.reason,
    })),
  ];

  const diffDomain = temporalDiffDomain(rows);

  return (
    <div className="space-y-12">
      <ReportSection id="ediciones" eyebrow="01 / Dos ediciones"
        title="Qué se compara y qué no"
        description={temporal.edition_caveat}>
        <div className="grid gap-4 sm:grid-cols-2">
          {temporal.editions.map(e => (
            <div key={e.id} className="rounded-lg border border-current/15 p-4">
              <p className="text-lg font-semibold">Edición {e.label}</p>
              <p className="mt-1 text-sm opacity-80">Trabajo de campo: {e.fieldwork}.</p>
              <p className="mt-2 text-xs opacity-70">{e.note}</p>
            </div>
          ))}
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Comparaciones liberadas", `${summary.released_comparisons}`,
              `${summary.regions} regiones × ${summary.age_groups} grupos de edad, sexo total`],
            ["Indicadores evaluados", `${summary.indicators_assessed}`,
              `${summary.comparable_after_harmonisation} comparable tras armonización, ${summary.not_comparable} no comparables`],
            ["Resultado de los contrastes", `${summary.evidence_of_change} / ${summary.released_comparisons}`,
              `con evidencia; ${summary.insufficient_evidence} sin evidencia suficiente; ${summary.not_evaluable} no evaluable`],
          ].map(([label, value, hint]) => (
            <div key={label} className="rounded-lg border border-current/15 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
              <dd className="mt-1 text-xs opacity-70">{hint}</dd>
            </div>
          ))}
        </dl>
        <Availability state="no-evaluable" className="mt-6"
          title="El nacional y la región Noroccidental no se liberan como cambio"
          reason={coverageReason} />
      </ReportSection>

      <ReportSection id="seleccion" eyebrow="02 / Selección"
        title="Filtros restringidos a lo comparable"
        description="Una combinación que no es comparable se queda visible y deshabilitada, con su motivo. Esta selección alimenta la gráfica, la tabla y la descarga.">
        <FilterBar
          groups={[
            { id: "indicator", label: "Indicador", value: selection.indicator, control: "select",
              onChange: set("indicator"), options: indicatorOptions,
              note: `Sólo un indicador de ${temporal.matrix.length} tiene una comparación entre ediciones demostrada.` },
            { id: "category", label: "Categoría", value: selection.category, control: "select",
              onChange: set("category"),
              options: [{ value: TEMPORAL_CATEGORY, label: TEMPORAL_CATEGORY },
                { value: "ultimo-ano", label: "Consumo en el último año", disabled: true,
                  disabledReason: "AL4 cambia de Sí/No a frecuencias entre ediciones y el cuadro publicado añade AL3/AL5. La regla de derivación no está conciliada." },
                { value: "ultimo-mes", label: "Consumo en el último mes", disabled: true,
                  disabledReason: "La definición de 2025 combina AL8, AL9, AL12, AL14, AL15 y AL16; compartir etiqueta no demuestra la misma derivación." }] },
            { id: "region", label: "Región", value: selection.region, control: "select",
              onChange: set("region"), options: regionOptions },
            { id: "age", label: "Edad (años)", value: selection.age, onChange: set("age"),
              options: TEMPORAL_AGES.map(a => ({ value: a, label: a.replace("-", " a "),
                hint: a === "12-65" ? "Universo completo" : undefined })),
              note: "Los tres grupos se solapan: 12 a 65 contiene a los otros dos." },
            { id: "sex", label: "Sexo", value: selection.sex, onChange: set("sex"),
              options: [{ value: TEMPORAL_SEX, label: "Total" },
                { value: "hombre", label: "Hombres", disabled: true,
                  disabledReason: "No hay resultados publicados de región por sexo en ambas ediciones, y DS2 cambia de sexo del entrevistado (2016–2017) a sexo asignado al nacer (2025)." },
                { value: "mujer", label: "Mujeres", disabled: true,
                  disabledReason: "No hay resultados publicados de región por sexo en ambas ediciones, y DS2 cambia de sexo del entrevistado (2016–2017) a sexo asignado al nacer (2025)." }] },
          ]}
          onReset={() => { replaceTemporalFilter("region", "all"); replaceTemporalFilter("age", "12-65"); window.dispatchEvent(new PopStateEvent("popstate")); }}
          note="La referencia nacional conserva su universo nacional y no cambia al elegir una región.">
          <DisabledReasons blockedRegionReason={coverageReason} />
        </FilterBar>
        <NationalScopeNote className="mt-4" />
      </ReportSection>

      <ReportSection id="prevalencias" eyebrow="03 / Prevalencias"
        title="Cada edición con su propio diseño"
        description="Cada porcentaje procede del cuadro publicado de su edición y se validó contra el microdato original con el ponderador de esa edición. Ninguna cifra se reestimó para acercarla a la otra.">
        {rows.length === 0 ? (
          <Availability state="no-disponible" title="Sin filas para esta combinación"
            reason="La combinación seleccionada no tiene una comparación liberada. Elige una de las ocho regiones comparables." />
        ) : (
          <FigureCard number="1"
            title={`Consumo de alcohol alguna vez, ${selection.age.replace("-", " a ")} años`}
            description="Porcentaje de la población del grupo de edad en cada región, con su intervalo de confianza del 95 %."
            chart={<EditionsChart rows={rows} />}
            table={<EditionsTable rows={rows} />}
            legend={<EditionsLegend />}
            onDownload={() => downloadTemporalCsv(
              `encodat_ediciones_${selection.age}_${selection.region}.csv`, temporalEditionsCsv(rows))}
            downloadLabel="Descargar estas filas (CSV)"
            source={<>Informe ENCODAT 2025, cuadros {rows[0].later.source_table} (p. {rows[0].later.source_page}); ambas ediciones se publican en el mismo cuadro. <a className="underline" href={rows[0].later.source_url}>Ver la fuente</a>.</>}
            notes={<p>La descarga entrega exactamente las filas de esta figura, con los mismos filtros. Las N son ponderadas: la de categoría es la publicada y la del universo se calcula del microdato de cada edición. No se muestran conteos muestrales.</p>}
          />
        )}
      </ReportSection>

      <ReportSection id="diferencias" eyebrow="04 / Diferencias"
        title="Cambio entre ediciones, en puntos porcentuales"
        description="2025 menos 2016–2017. La referencia en cero significa ausencia de cambio. El estado del contraste no se deduce de que el intervalo cruce el cero.">
        {rows.length === 0 ? (
          <Availability state="no-disponible" title="Sin diferencias para esta combinación"
            reason="La combinación seleccionada no tiene una comparación liberada." />
        ) : (
          <FigureCard number="2"
            title={`Diferencia 2016–2017 a 2025, ${selection.age.replace("-", " a ")} años`}
            description={`Intervalo de confianza del 95 % de la diferencia y p ajustada por Holm entre las ocho regiones del mismo grupo de edad.`}
            chart={
              <>
              <DiffPlot
                items={rows.map(({ pair, later }) => ({
                  key: pair.comparison_id,
                  label: pair.region_name,
                  diff: pair.difference_pp,
                  ciLow: pair.difference_ci_low,
                  ciHigh: pair.difference_ci_high,
                  state: contrastState(pair.change_status),
                  reason: contrastState(pair.change_status) === "no_evaluable"
                    ? pair.status_reason : undefined,
                  detail: (
                    <span className="text-xs opacity-75">
                      p ajustada {pair.p_adjusted === null ? "No disponible"
                        : pair.p_adjusted < 0.001 ? "< 0.001" : pair.p_adjusted.toFixed(3)}
                      {" · "}
                      <WeightedN value={later.weighted_denominator_n} kind="universo" compact />
                    </span>
                  ),
                }))}
                unit="%" domain={diffDomain}
                ariaLabel={`Diferencia de prevalencia entre 2016-2017 y 2025 por región, ${selection.age} años`}
                zeroLabel="Sin cambio (0 pp)"
                comparability={
                  <Availability state="disponible" title="Comparable tras armonización"
                    reason="AL1 conserva pregunta, códigos y periodo de referencia en las dos ediciones, sin faltantes, sobre las ocho regiones de composición común. El nacional y Noroccidental quedan fuera porque Sinaloa no está en 2025." />
                }
                harmonization={
                  <MethodDisclosure title="Armonización y método del contraste"
                    definition="Se igualó el periodo de referencia (alguna vez en la vida), el grupo de edad y la composición regional antes de restar. No se apilan microdatos: cada edición se estima con su propio diseño."
                    method={inference.summary}
                    derivedVariable={alcohol.derived_variable}
                    syntaxSource={alcohol.syntax_source as never}
                    syntaxNotes={alcohol.evidence}
                    sourceVariables={alcohol.source_variables}
                    precision={`Independencia: ${inference.independence} Multiplicidad: ${inference.multiplicity.method}. ${inference.multiplicity.rationale} Regla de estabilidad: ${inference.stability_rule}`}
                  />
                }
              />
              <ContrastStateList rows={rows} />
              </>
            }
            table={<DiffTable rows={rows} />}
            onDownload={() => downloadTemporalCsv(
              `encodat_diferencias_${selection.age}_${selection.region}.csv`, temporalDiffCsv(rows))}
            downloadLabel="Descargar estas diferencias (CSV)"
            source={<>Diferencias calculadas en la capa de análisis (<code className="break-all">encodat_analysis/temporal/</code>) sobre los porcentajes publicados de ambas ediciones.</>}
            notes={
              <div className="space-y-2">
                <p>Los tres estados posibles son los únicos admitidos: {CONTRAST_LABEL.evidencia.toLowerCase()}, {CONTRAST_LABEL.sin_evidencia.toLowerCase()} y {CONTRAST_LABEL.no_evaluable.toLowerCase()}. Un resultado sin evidencia suficiente <strong>no</strong> significa que las prevalencias sean iguales.</p>
                <p>La descarga entrega exactamente las filas de esta figura, con los mismos filtros.</p>
              </div>
            }
          />
        )}
      </ReportSection>

      <ReportSection id="metodo" eyebrow="05 / Método"
        title="De dónde sale cada varianza"
        description="La varianza de 2025 es exacta y se calcula con el diseño de la encuesta. La de 2016–2017 no existe en el archivo aportado y se reconstruye. Toda la cadena de evidencia es verificable paso a paso.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Availability state="disponible" title="Edición 2025"
            reason={inference.variance_sources.edition_2025} />
          <Availability state="pendiente" title="Edición 2016–2017"
            reason={inference.variance_sources.edition_2016_2017} />
        </div>
        <ol className="mt-6 space-y-4">
          {inference.evidence_chain.map(step => (
            <li key={step.step} className="rounded-lg border border-current/15 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Paso {step.step}</p>
              <p className="mt-1 font-semibold">{step.claim}</p>
              <p className="mt-2 text-sm opacity-85"><strong>Prueba:</strong> {step.test}</p>
              <p className="mt-1 text-sm opacity-85"><strong>Resultado:</strong> {step.result}</p>
              <p className="mt-1 text-xs opacity-65">
                Artefacto: <code className="break-all">{step.artifact}</code>
              </p>
            </li>
          ))}
        </ol>
        <Availability state="pendiente" className="mt-6"
          title="El eslabón más débil, dicho en voz alta"
          reason={inference.weakest_link} />
        <MethodDisclosure title="Fuentes, definición y precisión" open
          source={<>Informe ENCODAT 2025 completo, cuadros 2.2 (p. 50), 2.6 (p. 54) y 2.9 (p. 57), que publican las dos ediciones. Cuadro Suplementario A (p. 106) para la composición regional. Resumen Metodológico ENCODAT 2016 (p. 1) para las fechas de campo. <a className="underline" href={temporal.source_url}>Informe 2025</a>.</>}
          definition={alcohol.definition_2025}
          method={inference.mode === "contrast_with_reconstructed_2016_variance"
            ? "Diferencia de dos proporciones independientes con ajuste de Holm; la varianza de 2016–2017 es reconstruida y el veredicto sólo se publica si es estable en toda su banda de incertidumbre."
            : "Sólo comparación descriptiva."}
          derivedVariable={alcohol.derived_variable}
          syntaxSource={alcohol.syntax_source as never}
          syntaxNotes="La sintaxis SPSS oficial no incluye el bloque de alcohol, así que la definición operacional es del proyecto: AL1 = 1. Es la definición más simple posible del indicador y reproduce el cuadro publicado, pero su procedencia se declara."
          sourceVariables={alcohol.source_variables}
          precision="Cada cifra trae su IC 95 % y su CV. Las marcas de precisión del cuadro publicado (CV 15–29.9 % y CV ≥ 30 %) se conservan en el campo de precisión de cada registro y en la descarga."
        />
        <ul className="mt-6 space-y-2 text-sm opacity-85">
          {temporal.limitations.map((l, i) => (
            <li key={i} className="flex gap-2"><span aria-hidden="true">·</span><span>{l}</span></li>
          ))}
        </ul>
      </ReportSection>

      <ReportSection id="comparabilidad" eyebrow="06 / Comparabilidad"
        title={`Los ${temporal.matrix.length} indicadores, uno por uno`}
        description="Para los indicadores no liberados, «no comparable» significa no habilitado con la evidencia revisada, no una incompatibilidad demostrada. Cada fila enumera qué evidencia falta.">
        <FigureCard number="3" title="Matriz de correspondencias"
          description={`${summary.comparable} comparables, ${summary.comparable_after_harmonisation} comparable tras armonización y ${summary.not_comparable} no comparables.`}
          table={<MatrixTable />}
          defaultView="tabla"
          onDownload={() => downloadTemporalCsv("encodat_comparabilidad.csv", temporalMatrixCsv())}
          downloadLabel="Descargar la matriz completa (CSV)"
          source={<>Catálogo de variables y valores de cada edición, definición operacional de 2025 de la capa de análisis y cuadros publicados.</>}
          notes={<p>La descarga incluye además la pregunta candidata de 2016–2017, las categorías de cada edición, el universo, el denominador y el tratamiento de faltantes de cada indicador.</p>}
        />
      </ReportSection>
    </div>
  );
}

export default TemporalComparison;
