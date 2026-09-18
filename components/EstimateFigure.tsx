"use client";
import { useState } from "react";
import type { EstimateRecord, IndicatorMeta } from "@/lib/types";
import { FigureCard, Availability } from "./Report";
import { RangePlot } from "./RangePlot";
import { DataTable } from "./DataTable";
import { downloadCSV } from "@/lib/data";
import { SYNTAX_SOURCE_SHORT } from "@/lib/format";

/**
 * Figura de estimaciones: gráfica y tabla sobre **el mismo array de filas**,
 * y descarga de esas mismas filas. Un solo origen de datos para las tres.
 */
export function EstimateFigure({ number, title, description, rows, meta, labels, filename, dimensionNote, showIndicator = false }: {
  number: string; title: string; description: string; rows: EstimateRecord[];
  meta: IndicatorMeta; labels: string[]; filename: string; dimensionNote?: string;
  showIndicator?: boolean;
}) {
  const [view, setView] = useState<"grafica" | "tabla">("grafica");
  const items = rows.map((r, i) => ({ ...r, key: String(i), label: labels[i] }));
  const syntax = meta.syntax_source === "oficial" || meta.syntax_source === "reconstruccion_proyecto"
    ? SYNTAX_SOURCE_SHORT[meta.syntax_source] : "procedencia no declarada";
  return (
    <FigureCard
      number={number} title={title} description={description}
      view={view} onViewChange={setView}
      chart={rows.length
        ? <RangePlot items={items} unit={meta.unit} ariaLabel={title} />
        : <Availability state="no-disponible" title="Sin resultados publicables para esta figura" reason="No hay filas validadas para esta combinación de sexo y edad." />}
      table={rows.length
        ? <DataTable rows={rows} filename={filename} search={false} showIndicator={showIndicator} />
        : <Availability state="no-disponible" title="Sin filas que tabular" reason="La gráfica y la tabla comparten los mismos datos: si no hay estimaciones, tampoco hay tabla." />}
      onDownload={() => downloadCSV(filename, rows)}
      downloadDisabled={!rows.length}
      downloadLabel="Descargar estas filas (CSV)"
      notes={<p>{dimensionNote ?? "Esta figura compara una sola dimensión: el resto de los filtros permanece fijo."} Definición: {syntax}. Las N de la tabla y de la descarga son ponderadas y llevan su etiqueta.</p>}
      source={<>Fuente: {rows[0]?.source_locator ?? "No disponible"}.</>}
    />
  );
}
