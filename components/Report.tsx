"use client";
import { useId, useState, type ReactNode } from "react";
import type { SyntaxSource } from "@/lib/types";
import { CONTRAST_LABEL, fmtDiff, isMean, SYNTAX_SOURCE_HINT, type ContrastState } from "@/lib/format";
import { Availability, EstimateValue, SyntaxSourceTag, WeightedN, NationalScopeNote } from "./ui";

/* ================================================================
   Interfaz reutilizable del informe (punto 6 de COORDINACION_2026_09_17).
   Los agentes 2 y 3 la consumen sin editarla. Documentada con ejemplos en
   docs/REPORT_COMPONENTS.md. Toda firma previa se conserva: los campos
   nuevos son opcionales.
   ================================================================ */

export { Availability, EstimateValue, WeightedN, SyntaxSourceTag, NationalScopeNote };

/* ---------------- ReportSection ---------------- */

export function ReportSection({ id, eyebrow, title, description, children }:
  { id: string; eyebrow?: string; title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="report-section" aria-labelledby={`${id}-title`}>
      <header className="report-section-heading">
        {eyebrow && <span className="kicker">{eyebrow}</span>}
        <h2 id={`${id}-title`}>{title}</h2>
        {description && <div className="report-description">{description}</div>}
      </header>
      {children}
    </section>
  );
}

/* ---------------- ReportNav ---------------- */

export function ReportNav({ items, label = "En este informe" }:
  { items: { id: string; label: string }[]; label?: string }) {
  return (
    <aside className="report-nav">
      <nav aria-label={label}>
        <span className="kicker">{label}</span>
        {items.map((item, index) => (
          <a key={item.id} href={`#${item.id}`}>
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

/* ---------------- FigureCard ---------------- */

/**
 * Figura numerada. Dos modos:
 *  - heredado: `children` (y opcionalmente `footer`), como en la ronda previa.
 *  - conmutable: `chart` y `table` sobre **los mismos datos y filtros**, con
 *    `onDownload` para descargar exactamente esas filas. Un solo selector de
 *    datos alimenta las tres salidas, así que no hay dos fuentes de verdad.
 * `view`/`onViewChange` permiten que el estado viva en el padre (por ejemplo
 * sincronizado con la URL); si no se pasan, la figura lo gestiona.
 */
export function FigureCard({
  number, title, description, children, footer,
  chart, table, legend, source, notes, onDownload, downloadLabel = "Descargar datos de la figura",
  downloadDisabled = false, view, onViewChange, defaultView = "grafica", viewLabels,
}: {
  number: string | number; title: string; description?: ReactNode;
  children?: ReactNode; footer?: ReactNode;
  chart?: ReactNode; table?: ReactNode; legend?: ReactNode;
  source?: ReactNode; notes?: ReactNode;
  onDownload?: () => void; downloadLabel?: string; downloadDisabled?: boolean;
  view?: "grafica" | "tabla"; onViewChange?: (v: "grafica" | "tabla") => void;
  defaultView?: "grafica" | "tabla"; viewLabels?: { chart: string; table: string };
}) {
  const [internal, setInternal] = useState<"grafica" | "tabla">(defaultView);
  const current = view ?? internal;
  const setView = (v: "grafica" | "tabla") => { onViewChange ? onViewChange(v) : setInternal(v); };
  const switchable = Boolean(chart && table);
  const labels = viewLabels ?? { chart: "Gráfica", table: "Tabla" };
  const id = useId();
  return (
    <figure className="report-figure">
      <figcaption>
        <span className="figure-number">Figura {number}</span>
        <h3>{title}</h3>
        {description && <div className="report-description">{description}</div>}
      </figcaption>
      <div className="figure-content">
        {(switchable || onDownload) && (
          <div className="figure-toolbar">
            {switchable ? (
              <div className="figure-view-toggle" role="group" aria-label={`Vista de la figura ${number}: ${title}`}>
                <button type="button" aria-pressed={current === "grafica"} aria-controls={`${id}-panel`} onClick={() => setView("grafica")}>{labels.chart}</button>
                <button type="button" aria-pressed={current === "tabla"} aria-controls={`${id}-panel`} onClick={() => setView("tabla")}>{labels.table}</button>
              </div>
            ) : <span />}
            {onDownload && (
              <div className="figure-download">
                <button type="button" className="btn btn-secondary" disabled={downloadDisabled} onClick={onDownload}>{downloadLabel}</button>
              </div>
            )}
          </div>
        )}
        {legend && current === "grafica" && <div className="plot-legend">{legend}</div>}
        {switchable
          ? <div id={`${id}-panel`} role="region" aria-label={`${title} · ${current === "tabla" ? labels.table : labels.chart}`}>{current === "tabla" ? table : chart}</div>
          : (chart ?? table ?? children)}
        {switchable && children}
      </div>
      {(footer || source || notes) && (
        <div className="figure-footer">
          {notes}
          {source && <span className="figure-source">{source}</span>}
          {footer}
        </div>
      )}
    </figure>
  );
}

/* ---------------- MethodDisclosure ---------------- */

/**
 * Método, fuente, definición operacional, procedencia de la variable derivada
 * (`syntax_source`) y advertencias de precisión. Todo campo ausente se nombra
 * como ausente en lugar de omitirse en silencio.
 */
export function MethodDisclosure({
  title = "Fuentes y método", children,
  method, source, definition, derivedVariable, syntaxSource, syntaxNotes, precision, sourceVariables, open = false,
}: {
  title?: string; children?: ReactNode;
  method?: ReactNode; source?: ReactNode; definition?: ReactNode;
  derivedVariable?: string | null; syntaxSource?: SyntaxSource | null; syntaxNotes?: ReactNode;
  precision?: ReactNode; sourceVariables?: string[] | null; open?: boolean;
}) {
  const structured = method || source || definition || derivedVariable || syntaxSource || precision || sourceVariables;
  return (
    <details className="report-disclosure" open={open}>
      <summary>{title}</summary>
      <div>
        {structured && (
          <dl>
            {definition && <><dt>Definición operacional</dt><dd>{definition}</dd></>}
            {method && <><dt>Método</dt><dd>{method}</dd></>}
            <dt>Procedencia de la derivación</dt>
            <dd>
              <SyntaxSourceTag source={syntaxSource ?? null} variable={derivedVariable ?? undefined} />
              <span className="block mt-1">
                {syntaxSource === "oficial" || syntaxSource === "reconstruccion_proyecto"
                  ? SYNTAX_SOURCE_HINT[syntaxSource]
                  : "La fuente no declara la procedencia de esta derivación."}
              </span>
              {syntaxNotes && <span className="block mt-1">{syntaxNotes}</span>}
            </dd>
            {sourceVariables && sourceVariables.length > 0 && (
              <><dt>Variables de origen en el microdato</dt><dd><code>{sourceVariables.join(", ")}</code></dd></>
            )}
            {source && <><dt>Fuente y trazabilidad</dt><dd>{source}</dd></>}
            <dt>Precisión</dt>
            <dd>{precision ?? "Se muestran el IC 95 % y el coeficiente de variación cuando la fuente los aporta; un CV ausente se declara «No disponible». Una diferencia visual entre puntos no establece significancia."}</dd>
          </dl>
        )}
        {children}
      </div>
    </details>
  );
}

/* ---------------- DiffPlot ---------------- */

export interface DiffItem {
  key: string; label: string;
  /** Diferencia en puntos porcentuales (o años en indicadores de media). null = no disponible. */
  diff: number | null;
  ciLow?: number | null; ciHigh?: number | null;
  /** Estado del contraste. Solo estos tres valores están permitidos. */
  state?: ContrastState;
  /** Motivo cuando el contraste no es evaluable o falta la diferencia. */
  reason?: string;
  detail?: ReactNode;
}
/**
 * Diferencias con referencia en cero e IC. La línea de cero está siempre
 * visible y rotulada; el signo se escribe además de dibujarse. Un elemento
 * sin diferencia disponible o no evaluable no recibe marca: recibe texto.
 * No se deriva significancia del cruce de la línea: el estado lo aporta quien
 * llama, con los tres valores admitidos.
 */
export function DiffPlot({
  items, unit = "%", domain, ariaLabel, zeroLabel = "Sin cambio (0)",
  harmonization, comparability,
}: {
  items: DiffItem[]; unit?: string; domain?: number; ariaLabel?: string; zeroLabel?: string;
  harmonization?: ReactNode; comparability?: ReactNode;
}) {
  const [open, setOpen] = useState<string>();
  const id = useId();
  const mean = isMean(unit);
  const diffUnit = mean ? " años" : " pp";
  const magnitudes = items.flatMap((d) => [d.diff, d.ciLow, d.ciHigh].filter((v): v is number => v != null && Number.isFinite(v)).map(Math.abs));
  const dmax = domain ?? Math.max(1, Math.ceil((magnitudes.length ? Math.max(...magnitudes) : 1) * 1.15));
  const x = (v: number) => 100 + (Math.max(-dmax, Math.min(dmax, v)) / dmax) * 92;
  const active = items.find((d) => d.key === open);
  if (!items.length) {
    return <Availability state="no-disponible" title="Sin diferencias que mostrar" reason="No hay pares de ediciones seleccionados para esta combinación de filtros." />;
  }
  return (
    <div className="diff-plot" role="group" aria-label={ariaLabel ?? "Diferencias con referencia en cero"}>
      <div className="plot-legend">
        <span><i aria-hidden="true" />Diferencia entre ediciones</span>
        <span><i className="whisker" aria-hidden="true" />IC 95 % de la diferencia</span>
        <span>Línea vertical continua: {zeroLabel}</span>
        <span>Signo positivo: cifra mayor en la edición reciente</span>
      </div>
      {items.map((d) => {
        const hasDiff = d.diff != null && Number.isFinite(d.diff);
        const hasCi = d.ciLow != null && d.ciHigh != null;
        const state: ContrastState = d.state ?? (hasDiff ? "sin_evidencia" : "no_evaluable");
        return (
          <button
            key={d.key} type="button" className="diff-row"
            aria-expanded={open === d.key} aria-controls={open === d.key ? `${id}-detail` : undefined}
            aria-label={`${d.label}: ${hasDiff ? fmtDiff(d.diff, unit) : "diferencia no disponible"}. ${CONTRAST_LABEL[state]}. Consultar detalle`}
            onClick={() => setOpen((v) => (v === d.key ? undefined : d.key))}
            onKeyDown={(e) => { if (e.key === "Escape") setOpen(undefined); }}
          >
            <span className="diff-name">{d.label}</span>
            <div className="relative min-w-0">
              <svg viewBox="0 0 200 30" preserveAspectRatio="none" aria-hidden="true">
                <line x1={x(-dmax)} x2={x(dmax)} y1={15} y2={15} stroke="#DDE3DC" strokeWidth={1} />
                <line x1={100} x2={100} y1={2} y2={28} stroke="#15211F" strokeWidth={1.5} />
                {hasCi && <line x1={x(d.ciLow!)} x2={x(d.ciHigh!)} y1={15} y2={15} stroke="#0B5A52" strokeWidth={3} />}
                {hasCi && [d.ciLow!, d.ciHigh!].map((v, i) => <line key={i} x1={x(v)} x2={x(v)} y1={9} y2={21} stroke="#0B5A52" strokeWidth={1.5} />)}
                {hasDiff && <circle cx={x(d.diff!)} cy={15} r={4.5} fill="#084741" stroke="#FFFFFF" strokeWidth={1.5} />}
              </svg>
            </div>
            <span className="diff-value tnum">{hasDiff ? fmtDiff(d.diff, unit) : "No disponible"}</span>
          </button>
        );
      })}
      <div className="diff-axis" aria-hidden="true">
        <span>−{dmax}{diffUnit}</span><span>0</span><span>+{dmax}{diffUnit}</span>
      </div>
      <p className="diff-zero-note">
        La línea vertical marca la ausencia de cambio. El estado de cada fila lo determina la capa de análisis;
        el cruce o no de la línea de cero por un intervalo no se interpreta aquí como una prueba.
      </p>
      {active && (
        <div id={`${id}-detail`} className="estimate-detail" role="region" aria-label={`Detalle de ${active.label}`}>
          <strong>{active.label}</strong>
          <dl className="tnum">
            <div><dt>Diferencia</dt><dd>{fmtDiff(active.diff, unit)}</dd></div>
            <div><dt>IC 95 % de la diferencia</dt><dd>{active.ciLow != null && active.ciHigh != null ? `${fmtDiff(active.ciLow, unit)} a ${fmtDiff(active.ciHigh, unit)}` : "No disponible"}</dd></div>
            <div><dt>Estado del contraste</dt><dd>{CONTRAST_LABEL[active.state ?? "no_evaluable"]}</dd></div>
          </dl>
          {active.reason && <p className="mt-3">{active.reason}</p>}
          {active.detail}
        </div>
      )}
      {(comparability || harmonization) && (
        <div className="mt-4">
          {comparability}
          {harmonization}
        </div>
      )}
    </div>
  );
}

/* ---------------- FilterBar ---------------- */

export interface FilterOption {
  value: string; label: string; hint?: string;
  /** Combinación no comparable o no disponible: se muestra, no se oculta. */
  disabled?: boolean;
  /** Obligatorio en la práctica cuando `disabled`: la interfaz explica por qué. */
  disabledReason?: string;
}
export interface FilterGroup {
  id: string; label: string; value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  /** `segmented` para 2–4 opciones, `select` para listas largas. */
  control?: "segmented" | "select";
  note?: ReactNode;
}
/**
 * Un único selector de datos para la gráfica, la tabla y la descarga.
 * Una opción no comparable se deja visible y deshabilitada; al activarla se
 * muestra su motivo en lugar de cambiar la selección en silencio.
 * `lead` admite un control propio (por ejemplo el buscador de indicadores).
 */
export function FilterBar({
  title = "Selección de datos", groups, lead, note, onReset, resetLabel = "Restablecer", children, nationalScopeNote = true,
}: {
  title?: string; groups: FilterGroup[]; lead?: ReactNode; note?: ReactNode;
  onReset?: () => void; resetLabel?: string; children?: ReactNode; nationalScopeNote?: boolean;
}) {
  const [blocked, setBlocked] = useState<{ group: string; option: string; reason: string }>();
  const reject = (group: FilterGroup, option: FilterOption) =>
    setBlocked({ group: group.label, option: option.label, reason: option.disabledReason ?? "Esta combinación no está disponible en la fuente validada." });
  return (
    <section className="filter-panel" aria-label={title}>
      <span className="kicker">{title}</span>
      <div className="filter-grid">
        {lead}
        {groups.filter((g) => (g.control ?? "segmented") === "segmented").map((g) => (
          <div key={g.id}>
            <span className="field-label" id={`${g.id}-label`}>{g.label}</span>
            <div className="segmented" role="group" aria-labelledby={`${g.id}-label`}>
              {g.options.map((o) => (
                <button
                  key={o.value} type="button"
                  aria-pressed={g.value === o.value}
                  aria-disabled={o.disabled || undefined}
                  title={o.disabled ? o.disabledReason : o.hint}
                  onClick={() => (o.disabled ? reject(g, o) : (setBlocked(undefined), g.onChange(o.value)))}
                >
                  {o.label}{o.disabled && <span aria-hidden="true"> ·</span>}
                </button>
              ))}
            </div>
            {g.note && <p className="filter-note mt-2">{g.note}</p>}
          </div>
        ))}
      </div>
      {groups.some((g) => g.control === "select") && (
        <div className="filter-extra">
          {groups.filter((g) => g.control === "select").map((g) => (
            <label key={g.id}>
              <span className="field-label">{g.label}</span>
              <select
                className="field" value={g.value}
                onChange={(e) => {
                  const o = g.options.find((x) => x.value === e.target.value);
                  if (o?.disabled) reject(g, o); else { setBlocked(undefined); g.onChange(e.target.value); }
                }}
              >
                {g.options.map((o) => (
                  <option key={o.value} value={o.value} disabled={o.disabled}>
                    {o.label}{o.disabled ? " · no disponible" : ""}
                  </option>
                ))}
              </select>
              {g.note && <p className="filter-note mt-2">{g.note}</p>}
            </label>
          ))}
          {nationalScopeNote ? <NationalScopeNote /> : <span />}
          {onReset && <button type="button" className="btn btn-quiet" onClick={() => { setBlocked(undefined); onReset(); }}>{resetLabel}</button>}
        </div>
      )}
      {note && <p className="filter-note mt-3">{note}</p>}
      {blocked && (
        <p className="filter-disabled-note" role="status">
          <strong>{blocked.group} · {blocked.option}:</strong> {blocked.reason}
        </p>
      )}
      {children}
    </section>
  );
}
