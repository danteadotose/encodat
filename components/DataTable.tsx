"use client";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { EstimateRecord } from "@/lib/types";
import { SEX_LABEL, AGE_SHORT, unitSuffix, visibleReliability, intfmt } from "@/lib/format";
import { downloadCSV, getIndicator, INDICATORS } from "@/lib/data";
import { ClientReady, Icon, ShareView } from "./Controls";
type SortKey="ind"|"ambito"|"sex"|"age"|"estimate"|"cv";
const SORT_LABEL:Record<SortKey,string>={ind:"Indicador",ambito:"Ámbito",sex:"Sexo",age:"Edad",estimate:"Estimación",cv:"CV"};
const AMB=(r:EstimateRecord)=>r.geo_level==="nacional"?"Nacional":r.region_name??"";
const INDLBL=(id:string)=>getIndicator(id)?.short_label??id;
export function DataTable({rows,filename="encodat_datos.csv",search=true,showIndicator=false,selectedRegion,onSelectRegion}:
  {rows:EstimateRecord[];filename?:string;search?:boolean;showIndicator?:boolean;selectedRegion?:number;onSelectRegion?:(id:number)=>void}) {
  const pathname=usePathname(), sp=useSearchParams();
  const q=search?(sp.get("buscar")??""):"";
  const ind=showIndicator&&getIndicator(sp.get("indicador")??"")?sp.get("indicador")!:"all";
  const key=(sp.get("orden")??"estimate") as SortKey;
  const sort:SortKey=Object.keys(SORT_LABEL).includes(key)?key:"estimate";
  const dir=sp.get("sentido")==="asc"?1:-1;
  const set=(patch:Record<string,string|null>)=>{const p=new URLSearchParams(window.location.search);Object.entries(patch).forEach(([k,v])=>v===null?p.delete(k):p.set(k,v));window.history.replaceState(null,"",`${pathname}?${p}`);};
  const filtered=useMemo(()=>{
    const normal=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(); const t=normal(q.trim());
    const out=rows.filter(r=>(ind==="all"||r.indicator_id===ind)&&(!t||normal(`${INDLBL(r.indicator_id)} ${AMB(r)} ${SEX_LABEL[r.sex]} ${AGE_SHORT[r.age_group]}`).includes(t)));
    const value=(r:EstimateRecord)=>sort==="ind"?INDLBL(r.indicator_id):sort==="ambito"?AMB(r):sort==="sex"?r.sex:sort==="age"?r.age_group:sort==="cv"?r.cv:r.estimate;
    return out.sort((a,b)=>{const va=value(a),vb=value(b);if(va==null)return vb==null?0:1;if(vb==null)return -1;return typeof va==="string"&&typeof vb==="string"?va.localeCompare(vb,"es")*dir:va<vb?-dir:va>vb?dir:0;});
  },[q,ind,sort,dir,rows]);
  const size=50,totalPages=Math.max(1,Math.ceil(filtered.length/size));
  const requested=Number(sp.get("pagina")??1); const page=Number.isInteger(requested)?Math.min(totalPages,Math.max(1,requested)):1;
  const visible=filtered.slice((page-1)*size,page*size);
  const reset=()=>set({buscar:null,indicador:null,orden:null,sentido:null,pagina:null});
  const th=(k:SortKey)=> <th key={k} scope="col" aria-sort={sort===k?(dir===1?"ascending":"descending"):"none"} className={k==="estimate"||k==="cv"?"text-right":"text-left"}><button aria-label={`Ordenar por ${SORT_LABEL[k]}`} onClick={()=>set({orden:k,sentido:sort===k&&dir===-1?"asc":"desc",pagina:null})}>{SORT_LABEL[k]} <span aria-hidden="true">{sort===k?(dir===1?"↑":"↓"):"↕"}</span></button></th>;
  return <div><ClientReady />
    <div className="data-toolbar">
      {search&&<label><span className="field-label">Buscar en resultados</span><span className="search-field"><Icon name="search" /><input aria-label="Buscar en resultados" type="search" placeholder="Indicador, región, sexo o edad…" value={q} onChange={e=>set({buscar:e.target.value||null,pagina:null})} /></span></label>}
      {showIndicator&&<label><span className="field-label">Indicador</span><select className="field" value={ind} onChange={e=>set({indicador:e.target.value==="all"?null:e.target.value,pagina:null})}><option value="all">Todos los indicadores</option>{INDICATORS.map(i=><option key={i.indicator_id} value={i.indicator_id}>{i.short_label}</option>)}</select></label>}
      {(search||showIndicator)&&<button className="btn btn-quiet" onClick={reset}><Icon name="reset" />Restablecer</button>}
      <button className="btn btn-primary" disabled={!filtered.length} onClick={()=>downloadCSV(filename,filtered)}><Icon name="download" />Descargar {filtered.length.toLocaleString("es-MX")} filas</button>
      {showIndicator&&<ShareView href={`${pathname}?${sp}`} />}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-subink mb-3"><span role="status">{filtered.length.toLocaleString("es-MX")} resultados{q?` para “${q}”`:""}</span><span>Orden: {SORT_LABEL[sort]} · {dir===1?"ascendente":"descendente"}</span></div>
    <div className="table-scroll" role="region" aria-label="Tabla de resultados, desplazamiento horizontal" tabIndex={0}><table className="w-full tnum"><caption className="sr-only">Estimaciones con intervalo de confianza al 95 %, coeficiente de variación y las dos N ponderadas: población estimada de la categoría y población estimada del universo analítico. Los valores que la fuente no aporta se leen «No disponible».</caption><thead><tr>{showIndicator&&th("ind")}{th("ambito")}{th("sex")}{th("age")}{th("estimate")}<th scope="col">IC 95%</th>{th("cv")}<th scope="col" className="text-right">N ponderada · población estimada de la categoría</th><th scope="col" className="text-right">N ponderada · población estimada del universo analítico</th><th scope="col">Precisión</th></tr></thead><tbody>
      {visible.map(r=><tr key={`${r.indicator_id}-${r.geo_level}-${r.region_id}-${r.sex}-${r.age_group}`} data-selected={r.geo_level==="region"&&selectedRegion===r.region_id}>
        {showIndicator&&<td className="indicator-cell">{INDLBL(r.indicator_id)}</td>}
        <td className="whitespace-nowrap">{onSelectRegion&&r.geo_level==="region"?<button className="min-h-[44px] text-teal-deep font-semibold" aria-label={`Resaltar ${AMB(r)} en mapa y ranking`} aria-pressed={selectedRegion===r.region_id} onClick={()=>onSelectRegion(r.region_id)}>{AMB(r)}</button>:AMB(r)}</td>
        <td>{SEX_LABEL[r.sex]}</td><td className="whitespace-nowrap">{AGE_SHORT[r.age_group]}</td><td className="text-right font-semibold whitespace-nowrap">{r.estimate.toFixed(1)}{unitSuffix(getIndicator(r.indicator_id)?.unit)}</td><td className="text-right whitespace-nowrap text-subink">{r.ci_low.toFixed(1)}–{r.ci_high.toFixed(1)}{unitSuffix(getIndicator(r.indicator_id)?.unit)}</td><td className="text-right">{r.cv==null?"No disponible":`${r.cv.toFixed(1)}%`}</td><td className="text-right">{intfmt(r.weighted_n)}</td><td className="text-right">{intfmt(r.pop)}</td><td><span className={`reliability ${r.reliab==="media"||r.reliab==="baja"?"caution":""}`}>{visibleReliability(r.cv,r.reliab)??"No disponible"}</span></td>
      </tr>)}
    </tbody></table>{!filtered.length&&<div className="empty-state"><p>No hay filas que coincidan con esta búsqueda y estos filtros. La consulta es válida: lo que falta son resultados publicables para esa combinación.</p><button className="btn btn-secondary mt-3" onClick={reset}>Restablecer búsqueda y filtros</button></div>}</div>
    <div className="pagination"><span>{filtered.length?`${(page-1)*size+1}–${Math.min(page*size,filtered.length)} de ${filtered.length.toLocaleString("es-MX")} filas`:"0 filas"}</span>{totalPages>1&&<div className="flex items-center gap-3"><button className="btn btn-secondary" disabled={page===1} onClick={()=>set({pagina:String(page-1)})}>Anterior</button><span>Página {page} de {totalPages}</span><button className="btn btn-secondary" disabled={page===totalPages} onClick={()=>set({pagina:String(page+1)})}>Siguiente</button></div>}</div>
    <p className="table-note">Las dos columnas de N son poblaciones ponderadas, nunca números de casos de la muestra: la de categoría cuenta a quienes cumplen la definición y la del universo es el denominador del indicador. Una N ausente se lee «No disponible» y no se deduce del porcentaje. El ámbito «Nacional» conserva su universo nacional aunque se filtre una región.</p>
    <p className="download-scope mt-3">El CSV incluye todas las filas de la búsqueda y los filtros actuales, en este orden; incluye también las páginas no visibles, y sus columnas de N están etiquetadas por significado.</p>
  </div>;
}
