"use client";
import { useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Sex, AgeGroup, EstimateRecord } from "@/lib/types";
import { getIndicator, national, query, availableSexes, availableAges, defaultIndicatorId } from "@/lib/data";
import { SEX_LABEL, AGE_LABEL, AGE_SHORT, isMean } from "@/lib/format";
import { SERIES } from "@/lib/scale";
import { SectionHeading, Card, ValidationBadge } from "./ui";
import { RangePlot, RangeItem } from "./RangePlot";
import { RegionMap } from "./RegionMap";
import { NationalHero } from "./NationalHero";
import { DataTable } from "./DataTable";
import { DownloadBar } from "./DownloadBar";
import { ClientReady, Icon, IndicatorPicker, ShareView, ReadingGuide } from "./Controls";

function Segmented<T extends string>({value, options, onChange, label}: {value:T; options:{v:T;label:string}[]; onChange:(value:T)=>void;label:string}) {
  return <div><span className="field-label">{label}</span><div className="segmented" role="group" aria-label={label}>{options.map(o => <button key={o.v} aria-pressed={value===o.v} onClick={()=>onChange(o.v)}>{o.label}</button>)}</div></div>;
}
const range = (r: EstimateRecord, key: string, label: string, color?: string, emphasis?: boolean): RangeItem => ({ key, label, estimate:r.estimate, ci_low:r.ci_low, ci_high:r.ci_high, cv:r.cv, reliab:r.reliab, color, emphasis });

export function ExploreView() {
  const pathname = usePathname(); const sp = useSearchParams();
  const indId = getIndicator(sp.get("ind") ?? "")?.indicator_id ?? defaultIndicatorId();
  const meta = getIndicator(indId)!;
  const sexes = availableSexes(indId), ages = availableAges(indId);
  const sexParam = sp.get("sex"), ageParam = sp.get("age");
  const sex:Sex = sexes.includes(sexParam as Sex) ? sexParam as Sex : sexes.includes("total") ? "total" : sexes[0];
  const age:AgeGroup = ages.includes(ageParam as AgeGroup) ? ageParam as AgeGroup : ages.includes("12-65") ? "12-65" : ages[0];
  const hero = national(indId, sex, age);
  const regionRows = query({indicator_id:indId,sex,age_group:age,geo_level:"region"}).slice().sort((a,b)=>b.estimate-a.estimate);
  const focusParam = sp.get("region");
  const focus = focusParam && regionRows.some(r=>String(r.region_id)===focusParam) ? Number(focusParam) : undefined;
  const showTable = sp.get("tabla")==="1";
  const normalized = new URLSearchParams({ind:indId,sex,age});
  if (focus !== undefined) normalized.set("region",String(focus));
  if (showTable) { normalized.set("tabla","1"); if (sp.has("orden")) normalized.set("orden",sp.get("orden")!); if (sp.has("sentido")) normalized.set("sentido",sp.get("sentido")!); }
  const normalizedString = normalized.toString();
  const setParam = useCallback((patch:Record<string,string|null>)=>{
    const p = new URLSearchParams(window.location.search);
    Object.entries(patch).forEach(([k,v])=>v===null?p.delete(k):p.set(k,v));
    window.history.replaceState(null,"",`${pathname}?${p}`);
  },[pathname]);
  const reset=()=>window.history.replaceState(null,"",pathname);
  const selectRegion=(id:number)=>setParam({region:focus===id?null:String(id)});
  const corrected=(sp.has("ind")&&sp.get("ind")!==indId)||(sexParam!==null&&sexParam!==sex)||(ageParam!==null&&ageParam!==age)||(focusParam!==null&&focus===undefined);
  const scope=`${SEX_LABEL[sex]} · ${AGE_LABEL[age]}`;
  const valueWord=isMean(meta.unit)?"Edad media":"Prevalencia";
  const sexItems=sexes.flatMap(s=>{const r=national(indId,s,age);return r?[range(r,s,SEX_LABEL[s],SERIES[s],s===sex)]:[];});
  const ageItems=ages.flatMap(a=>{const r=national(indId,sex,a);return r?[range(r,a,AGE_LABEL[a],"#137A80",a===age)]:[];});
  const sexByAge=ages.flatMap(a=>(["hombres","mujeres"] as Sex[]).filter(s=>sexes.includes(s)).flatMap(s=>{const r=national(indId,s,a);return r?[range(r,`${a}-${s}`,`${AGE_SHORT[a]} · ${SEX_LABEL[s]}`,SERIES[s])]:[];}));
  const rankItems=[...(hero?[range(hero,"nac","Nacional","#1A1813",true)]:[]),...regionRows.map(r=>range(r,`r${r.region_id}`,r.region_name??"Región","#137A80",focus===r.region_id))];
  const tableRows=[...(hero?[hero]:[]),...regionRows];
  const selectedRow=regionRows.find(r=>r.region_id===focus);
  const filename=`encodat2025_${indId}_${sex}_${age}.csv`;
  return <div className="space-y-7"><ClientReady />
    <header className="explore-heading"><div className="min-w-0"><div className="kicker mb-2">Explorar / {meta.category}</div><h1 className="font-display font-bold text-ink">{meta.label}</h1><p className="mt-2 text-subink text-sm">{meta.period} · {meta.unit}</p><div className="mt-3"><ValidationBadge status={meta.validation_status} computed={meta.computed_national} official={meta.official_national} diff={meta.validation_diff} unit={meta.unit} /><span className="block text-xs text-faint mt-1">Referencia: nacional, total de 12 a 65 años.</span></div></div><ShareView href={`${pathname}?${normalizedString}`} /></header>
    <section className="filter-panel" aria-label="Filtros del explorador"><div className="filter-grid">
      <IndicatorPicker value={indId} onChange={v=>setParam({ind:v,region:null})} />
      <Segmented label="Sexo" value={sex} onChange={v=>setParam({sex:v})} options={sexes.map(s=>({v:s,label:SEX_LABEL[s]}))} />
      <Segmented label="Grupo de edad (años)" value={age} onChange={v=>setParam({age:v})} options={ages.map(a=>({v:a,label:AGE_SHORT[a]}))} />
    </div><div className="active-filters"><span className="text-sm text-subink">Vista actual</span><span className="chip">{SEX_LABEL[sex]}</span><span className="chip">{AGE_SHORT[age]} años</span><span className="chip">Nacional y regiones</span><button className="btn btn-quiet ml-auto" onClick={reset}><Icon name="reset" />Restablecer</button></div></section>
    {corrected&&<p role="status" className="estimate-detail">El enlace contenía una selección no disponible. Se muestra una opción válida con los filtros indicados arriba.</p>}
    {hero?<NationalHero rec={hero} meta={meta} scopeLabel={scope} />:<div className="empty-state"><p>No hay una estimación nacional para esta combinación.</p><button className="btn btn-secondary mt-3" onClick={reset}>Restablecer filtros</button></div>}
    <ReadingGuide />
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-5 sm:p-6"><SectionHeading title="Comparación por sexo" sub={`${valueWord} nacional · ${AGE_LABEL[age]}.`} /><RangePlot key={`${indId}-${age}`} items={sexItems} unit={meta.unit} ariaLabel="Comparación por sexo" /></Card>
      <Card className="p-5 sm:p-6"><SectionHeading title="Comparación por edad" sub={`${valueWord} nacional · ${SEX_LABEL[sex]}.`} /><RangePlot key={`${indId}-${sex}`} items={ageItems} unit={meta.unit} ariaLabel="Comparación por edad" /></Card>
    </div>
    {sexByAge.length>0&&<Card className="p-5 sm:p-6"><SectionHeading title="Sexo por grupo de edad" sub={`${valueWord} nacional; hombres y mujeres en cada grupo de edad.`} /><RangePlot key={indId} items={sexByAge} unit={meta.unit} ariaLabel="Sexo por edad" /></Card>}
    <section id="panorama-regional"><SectionHeading kicker="Geografía · 9 regiones" title="Panorama regional" sub={`${scope}. Las estimaciones representan regiones, no estados.`} />
      <div className="flex items-center gap-3 flex-wrap mb-4 text-sm text-subink" role="status">{selectedRow?<><span className="chip">Resaltada: {selectedRow.region_name}</span><button className="btn btn-quiet" onClick={()=>setParam({region:null})}><Icon name="close" />Quitar selección</button></>:<span>Selecciona una región en el mapa o el ranking.</span>}<span>Resaltar no filtra los resultados ni la descarga.</span></div>
      <div className="region-layout"><Card className="p-5 sm:p-6"><h3 className="font-semibold mb-4">Mapa por región</h3><RegionMap rows={regionRows} unit={meta.unit} selected={focus} onSelect={selectRegion} /></Card><Card className="p-5 sm:p-6"><h3 className="font-semibold mb-4">Ranking regional</h3><RangePlot items={rankItems} unit={meta.unit} ariaLabel="Ranking regional" selectedKey={focus===undefined?undefined:`r${focus}`} onSelect={key=>{if(key==="nac")setParam({region:null});else selectRegion(Number(key.slice(1)));}} /></Card></div>
    </section>
    <section className="space-y-4" aria-label="Tabla y descarga"><DownloadBar rows={tableRows} filename={filename} onToggleTable={()=>setParam({tabla:showTable?null:"1"})} showTable={showTable} />{showTable&&<DataTable key={`${indId}-${sex}-${age}`} rows={tableRows} filename={filename} search={false} selectedRegion={focus} onSelectRegion={selectRegion} />}</section>
    <section className="border-t hairline pt-6 text-sm text-subink space-y-3"><h2 className="text-lg font-semibold text-ink">Acerca de este indicador</h2><p>{meta.definition}</p><p><strong className="text-ink">Periodo:</strong> {meta.period} · <strong className="text-ink">Variables fuente:</strong> <code className="break-words">{meta.source_variable}</code></p><p><strong className="text-ink">Nota:</strong> {meta.notes}</p></section>
  </div>;
}
