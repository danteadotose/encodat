import Link from "next/link";
import {
  national, query, getIndicator, indicatorsByCategory, INDICATORS, RECORDS,
  RESULT_INDICATOR_IDS, syntaxSourceCounts, unavailableIndicators, SYNTAX_GAPS,
  AUDIT_DATE, DATASET_YEAR, REGIONS,
} from "@/lib/data";
import { SEX_LABEL, AGE_LABEL, SYNTAX_SOURCE_LABEL } from "@/lib/format";
import { RegionMap } from "@/components/RegionMap";
import { NationalHero } from "@/components/NationalHero";
import { EstimateFigure } from "@/components/EstimateFigure";
import { ReportNav, ReportSection, FigureCard, MethodDisclosure, Availability, SyntaxSourceTag } from "@/components/Report";

const ALC = "alc_alguna_vez";
/** Indicadores de salud mental y violencia con resultados publicables, en el orden del catálogo. */
const SALUD = ["malestar_k10", "ideacion_suicida", "plan_suicida", "intento_suicida", "trat_salud_mental", "violencia_cualquiera"];

const SECTIONS = [
  { id: "alcance", label: "Qué contiene y qué no" },
  { id: "alcohol", label: "Alcohol" },
  { id: "salud-mental", label: "Salud mental y violencia" },
  { id: "territorio", label: "Lectura regional" },
  { id: "otros-analisis", label: "Ediciones y asociaciones" },
  { id: "catalogo", label: "Catálogo y fuentes" },
];

export default function Home() {
  const alcMeta = getIndicator(ALC)!;
  const alcNat = national(ALC, "total", "12-65");
  const alcRegions = query({ indicator_id: ALC, sex: "total", age_group: "12-65", geo_level: "region" });
  const alcSexRows = (["total", "hombres", "mujeres"] as const).flatMap(s => { const r = national(ALC, s, "12-65"); return r ? [r] : []; });

  const saludRows = SALUD.flatMap(id => { const r = national(id, "total", "12-65"); return r ? [r] : []; });
  const saludLabels = saludRows.map(r => getIndicator(r.indicator_id)?.short_label ?? r.indicator_id);

  const counts = syntaxSourceCounts();
  const unavailable = unavailableIndicators();
  const ranked = alcRegions.slice().sort((a, b) => b.estimate - a.estimate);
  const top = ranked[0], bottom = ranked[ranked.length - 1];

  return <div className="report-shell">
    <header className="report-intro">
      <span className="kicker">México · Encuesta nacional · Edición {DATASET_YEAR}</span>
      <h1>Consumo de sustancias <em>y salud mental</em></h1>
      <div className="report-intro-bottom">
        <p className="report-standfirst">
          Una lectura de la ENCODAT con estimaciones ponderadas, su incertidumbre y su alcance geográfico
          regional. Este informe publica una cifra solo cuando existe evidencia de validación; cuando no la
          hay, dice qué falta y por qué, en lugar de mostrar un número.
        </p>
        <Link href="/explorar" className="btn btn-primary">Consultar los indicadores <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="report-updated">
        <span>Última revisión de disponibilidad: {AUDIT_DATE}</span>
        <span>{RECORDS.length.toLocaleString("es-MX")} estimaciones publicables</span>
        <span>{RESULT_INDICATOR_IDS.length} de {INDICATORS.length} indicadores del catálogo con cifra</span>
        <span>Unidad geográfica: {REGIONS.length} regiones</span>
      </div>
    </header>

    <div className="report-layout">
      <ReportNav items={SECTIONS} />
      <article className="report-body">

        <ReportSection id="alcance" eyebrow="01 / Alcance" title="Qué contiene este informe y qué todavía no"
          description="El catálogo y los resultados no coinciden, y esa distancia es el dato más importante de esta edición.">
          <div className="report-prose">
            <p>
              El catálogo documenta <strong>{INDICATORS.length} indicadores</strong>. Hoy se publican cifras de
              <strong> {RESULT_INDICATOR_IDS.length}</strong>: {RESULT_INDICATOR_IDS.length === 7 ? "alcohol alguna vez, seis indicadores de salud mental y violencia" : "los que constan en el manifiesto de disponibilidad"}.
              Los <strong>{unavailable.length} restantes</strong> siguen consultables, con su definición y su
              estado de disponibilidad, pero <strong>sin ninguna cifra</strong>: cada uno indica qué evidencia
              le falta.
            </p>
            <p>
              Cada indicador declara además de dónde viene su definición operacional. De los{" "}
              {INDICATORS.length} del catálogo, <strong>{counts.oficial}</strong> derivan de la sintaxis oficial
              de la encuesta y <strong>{counts.reconstruccion_proyecto}</strong> son derivaciones propias del
              proyecto, porque el texto oficial que las define no está disponible.
              {counts.sin_declarar > 0 && <> {counts.sin_declarar} no declaran su procedencia.</>}{" "}
              Esa diferencia se muestra en cada figura y en cada ficha; no es un detalle interno.
            </p>
          </div>
          <div className="tag-row mt-5">
            <SyntaxSourceTag source="oficial" />
            <SyntaxSourceTag source="reconstruccion_proyecto" />
          </div>
          <Availability state="pendiente" title="Evidencia que falta y no se sustituye por otra">
            <ul className="mt-2 list-disc pl-5">
              {SYNTAX_GAPS.map(g => <li key={g} className="mt-1">{g}</li>)}
            </ul>
          </Availability>
        </ReportSection>

        <ReportSection id="alcohol" eyebrow="02 / Alcohol" title="Consumo de alcohol alguna vez en la vida"
          description={`Población de ${AGE_LABEL["12-65"]}. Es el indicador de consumo con auditoría específica de su estimación nacional y de las nueve regionales.`}>
          {alcNat
            ? <>
              <NationalHero rec={alcNat} meta={alcMeta} scopeLabel={`${SEX_LABEL.total} · ${AGE_LABEL["12-65"]}`} />
              <ol className="report-findings">
                <li>
                  <span className="finding-mark" aria-hidden="true">1</span>
                  <div>
                    La estimación nacional es de <strong>{alcNat.estimate.toFixed(1)} %</strong> de la población
                    de 12 a 65 años, con un intervalo de confianza del 95 % de {alcNat.ci_low.toFixed(1)} a{" "}
                    {alcNat.ci_high.toFixed(1)} %.
                    <span className="finding-ref">Fuente: {alcNat.source_locator ?? "No disponible"}. Figura 1.</span>
                  </div>
                </li>
                {alcSexRows.length === 3 && (
                  <li>
                    <span className="finding-mark" aria-hidden="true">2</span>
                    <div>
                      Por sexo, la estimación es de <strong>{alcSexRows[1].estimate.toFixed(1)} %</strong> en
                      hombres (IC 95 % {alcSexRows[1].ci_low.toFixed(1)}–{alcSexRows[1].ci_high.toFixed(1)}) y de{" "}
                      <strong>{alcSexRows[2].estimate.toFixed(1)} %</strong> en mujeres (IC 95 %{" "}
                      {alcSexRows[2].ci_low.toFixed(1)}–{alcSexRows[2].ci_high.toFixed(1)}). El informe describe
                      ambas cifras y sus intervalos; no realiza un contraste entre los dos grupos.
                      <span className="finding-ref">Figura 1, vista por sexo.</span>
                    </div>
                  </li>
                )}
                {top && bottom && (
                  <li>
                    <span className="finding-mark" aria-hidden="true">3</span>
                    <div>
                      Entre las nueve regiones, la estimación observada más alta corresponde a{" "}
                      <strong>{top.region_name}</strong> ({top.estimate.toFixed(1)} %, IC 95 %{" "}
                      {top.ci_low.toFixed(1)}–{top.ci_high.toFixed(1)}) y la más baja a{" "}
                      <strong>{bottom.region_name}</strong> ({bottom.estimate.toFixed(1)} %, IC 95 %{" "}
                      {bottom.ci_low.toFixed(1)}–{bottom.ci_high.toFixed(1)}). Son posiciones descriptivas dentro
                      de este filtro: no constituyen una prueba de que las regiones difieran.
                      <span className="finding-ref">Figura 2, mapa y gráfica regional.</span>
                    </div>
                  </li>
                )}
              </ol>
              <EstimateFigure
                number="1" title="Consumo de alcohol alguna vez, nacional y por sexo"
                description="Cada punto es una estimación puntual; la línea horizontal es su intervalo de confianza del 95 %."
                rows={alcSexRows} labels={alcSexRows.map(r => SEX_LABEL[r.sex])} meta={alcMeta}
                filename="encodat2025_alc_alguna_vez_sexo_12-65.csv"
                dimensionNote="Compara sexo con la edad fija en 12 a 65 años."
              />
              <p className="report-prose">
                Las tres filas comparten universo y periodo, así que se leen juntas. La gráfica, la tabla y la
                descarga de esta figura son la misma observación: el conmutador no cambia los datos, solo su
                presentación.
              </p>
            </>
            : <Availability state="no-disponible" title="Estimación de alcohol no disponible" reason="El manifiesto de disponibilidad no habilita la referencia nacional de este indicador en esta revisión." />}
        </ReportSection>

        <ReportSection id="salud-mental" eyebrow="03 / Salud mental y violencia" title="Los otros seis indicadores con cifra"
          description="Malestar psicológico, ideación, plan e intento suicida, tratamiento de salud mental y violencia recibida. Todos referidos a la población de 12 a 65 años, total nacional.">
          {saludRows.length
            ? <>
              <EstimateFigure
                number="2" title="Estimaciones nacionales de salud mental y violencia"
                description="Seis indicadores distintos en una misma escala porcentual. Cada uno tiene su propia definición y su propio denominador: la figura los pone en paralelo, no los suma ni los compara entre sí."
                rows={saludRows} labels={saludLabels} meta={getIndicator(saludRows[0].indicator_id)!}
                filename="encodat2025_salud_mental_nacional_12-65.csv"
                dimensionNote="Seis indicadores independientes, con el mismo universo de 12 a 65 años y sexo total."
                showIndicator
              />
              <p className="report-prose">
                Los seis provienen de derivaciones propias del proyecto: la sintaxis oficial de salud mental,
                violencia y escalas no está disponible, y la ficha de cada indicador lo declara. Las cifras no
                se ajustaron para coincidir con ninguna publicación.
              </p>
            </>
            : <Availability state="no-disponible" title="Sin estimaciones de salud mental publicables" reason="Ningún indicador de este bloque está habilitado en la revisión actual." />}
        </ReportSection>

        <ReportSection id="territorio" eyebrow="04 / Territorio" title="Nueve regiones, una sola unidad de análisis"
          description="La geografía del informe es regional. Las entidades federativas solo construyen los contornos del mapa: no tienen estimación propia.">
          <FigureCard
            number="3" title="Consumo de alcohol alguna vez, por región"
            description={`Total · ${AGE_LABEL["12-65"]} · ${DATASET_YEAR}. Selecciona una región en el mapa o en la lista para consultar su estimación, su intervalo y sus N ponderadas.`}
            notes={<p>El color codifica seis clases entre el mínimo y el máximo del filtro; además, cada región lleva su cifra impresa, de modo que el color no es el único portador del dato. Las diferencias entre regiones son descriptivas.</p>}
            source={<>Fuente: {alcRegions[0]?.source_locator ?? "No disponible"}. Sinaloa no está incluido en la encuesta y se dibuja hachurado, nunca imputado.</>}
          >
            {alcRegions.length
              ? <RegionMap rows={alcRegions} unit={alcMeta.unit} />
              : <Availability state="no-disponible" title="Sin estimaciones regionales" reason="No hay filas regionales publicables para este indicador y universo." />}
            <Link href={`/explorar?ind=${ALC}#panorama-regional`} className="text-link">Abrir la comparación regional con su tabla y su descarga →</Link>
          </FigureCard>
        </ReportSection>

        <ReportSection id="otros-analisis" eyebrow="05 / Otros análisis" title="Entre ediciones y entre indicadores"
          description="Dos análisis con su propio método y sus propios límites, documentados en sus páginas.">
          <div className="report-feature-link">
            <div>
              <h3>Comparación entre ediciones: 2016–2017 y 2025</h3>
              <p>
                Antes de leer un cambio hay que revisar la equivalencia de la pregunta, del universo y de la
                cobertura territorial. Cada par declara si la comparación es evaluable y con qué evidencia.
              </p>
            </div>
            <Link href="/comparar" className="btn btn-primary">Comparar ediciones →</Link>
          </div>
          <div className="mt-6">
            <h3 className="font-semibold text-lg">Asociaciones entre indicadores</h3>
            <p className="report-description mt-2">
              La matriz de asociaciones excluye los pares con dependencia estructural por definición, con su
              registro de exclusiones descargable. Una correlación observada alta no es por sí misma un motivo
              de exclusión, y ninguna asociación se interpreta como causa.
            </p>
            <Link href="/correlaciones" className="text-link">Consultar asociaciones y exclusiones →</Link>
          </div>
        </ReportSection>

        <ReportSection id="catalogo" eyebrow="06 / Catálogo y fuentes" title="Todos los indicadores, con o sin cifra"
          description="El catálogo completo permanece consultable. Cada indicador sin resultados muestra su estado y su motivo.">
          <div className="topic-index">
            {indicatorsByCategory().map(g => (
              <details key={g.category}>
                <summary>{g.category}<span>{g.items.length} indicadores</span></summary>
                <div>
                  {g.items.map(i => (
                    <Link key={i.indicator_id} href={`/explorar?ind=${i.indicator_id}`}>
                      {i.short_label}
                      <span>{i.period} · {RESULT_INDICATOR_IDS.includes(i.indicator_id) ? "con cifra" : "sin cifra"} →</span>
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </div>
          <MethodDisclosure title="Cómo se decide publicar una cifra">
            <p>
              Las visualizaciones consultan tablas precalculadas y revisadas. El navegador no recalcula
              estimaciones desde microdatos. Una coincidencia nacional con una cifra publicada respalda esa
              celda y no valida automáticamente todos los desgloses del indicador.
            </p>
            <p>
              Toda N de población mostrada es ponderada y declara su significado: población estimada de la
              categoría o población estimada del universo analítico. Cuando la fuente no la aporta se lee
              «No disponible»; no se sustituye por el número de casos de la muestra ni se deduce dividiendo.
            </p>
            <div className="flex gap-4 flex-wrap mt-3">
              <Link className="text-link" href="/datos">Tabla completa y descargas</Link>
              <Link className="text-link" href="/metodologia">Metodología y alcance</Link>
              <Link className="text-link" href="/metodologia#derivacion">Procedencia de las definiciones</Link>
            </div>
          </MethodDisclosure>
          <details className="catalog-details mt-8">
            <summary>
              <span>Indicadores sin resultados publicables</span>
              <span className="catalog-count">{unavailable.length} de {INDICATORS.length} · cada uno con su motivo</span>
            </summary>
            <div className="catalog-list">
              {unavailable.map(({ meta, availability }) => (
                <div className="catalog-item" key={meta.indicator_id}>
                  <div>
                    <h3>{meta.label}</h3>
                    <p>{availability.reason}</p>
                  </div>
                  <div className="tag-row">
                    <SyntaxSourceTag source={meta.syntax_source ?? null} variable={meta.derived_variable ?? undefined} compact />
                    {meta.syntax_source && <span className="sr-only">{SYNTAX_SOURCE_LABEL[meta.syntax_source]}</span>}
                  </div>
                  <Link className="text-link" href={`/explorar?ind=${meta.indicator_id}`}>Ver ficha →</Link>
                </div>
              ))}
            </div>
          </details>
        </ReportSection>

      </article>
    </div>
  </div>;
}
