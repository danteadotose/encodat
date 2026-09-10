"use client";
import type { EstimateRecord } from "@/lib/types";
import { downloadCSV } from "@/lib/data";
import { Icon } from "./Controls";
export function DownloadBar({rows,filename,onToggleTable,showTable}:{rows:EstimateRecord[];filename:string;onToggleTable?:()=>void;showTable?:boolean}) {
  return <div className="download-bar">{onToggleTable&&<button className="btn btn-secondary" aria-expanded={showTable} onClick={onToggleTable}>{showTable?"Ocultar tabla":"Ver tabla de resultados"}</button>}<button className="btn btn-primary" disabled={!rows.length} onClick={()=>downloadCSV(filename,rows)}><Icon name="download" />Descargar CSV · {rows.length} filas</button><p className="download-scope">Incluye todas las filas nacionales y regionales del indicador, sexo y edad seleccionados. Resaltar una región no cambia el CSV.</p></div>;
}
