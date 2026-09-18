"use client";
import type { EstimateRecord } from "@/lib/types";
import { downloadCSV } from "@/lib/data";
import { Icon } from "./Controls";

/** Descarga de exactamente las filas visibles en la figura y la tabla. */
export function DownloadBar({ rows, filename, onToggleTable, showTable }:
  { rows: EstimateRecord[]; filename: string; onToggleTable?: () => void; showTable?: boolean }) {
  return <div className="download-bar">
    {onToggleTable && <button type="button" className="btn btn-secondary" aria-expanded={showTable} onClick={onToggleTable}>{showTable ? "Ocultar tabla" : "Ver tabla de resultados"}</button>}
    <button type="button" className="btn btn-primary" disabled={!rows.length} onClick={() => downloadCSV(filename, rows)}><Icon name="download" />Descargar CSV · {rows.length} filas</button>
    <p className="download-scope">
      Descarga las mismas filas que muestran la gráfica y la tabla con los filtros actuales, incluida la
      referencia nacional cuando está disponible. Las columnas de N son ponderadas y van etiquetadas por
      significado (<code>weighted_n</code> = población de la categoría; <code>weighted_denominator_n</code> =
      población del universo analítico). Un valor ausente se escribe «No disponible».
    </p>
  </div>;
}
