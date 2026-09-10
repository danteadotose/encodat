import { DATASET_YEAR, EXCLUDED } from "@/lib/data";

const sectionId=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-$/," ").trim();
const sections=["Diseño de la encuesta","Ponderación","Intervalos de confianza","Coeficiente de variación (CV)","Medias y escalas","Definiciones operacionales y validación","Correlaciones (co-ocurrencia individual)","Interpretación de las estimaciones","Alcance de esta versión y datos faltantes","Trazabilidad"];
function H({ children }: { children: React.ReactNode }) {
  return <h2 id={sectionId(String(children))} className="font-display text-2xl font-semibold mt-10 mb-3">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-ink/90 max-w-measure mb-3">{children}</p>;
}

export default function MetodologiaPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="text-xs uppercase tracking-widest text-teal-deep font-semibold mb-1">Metodología</div>
      <h1 className="font-display text-4xl font-semibold mb-2">Cómo se calculan estas cifras</h1>
      <p className="text-subink max-w-measure">
        La transparencia es prioritaria. Aquí se documenta el diseño de la encuesta y cada decisión
        de cálculo. No se incluye información metodológica que no provenga de las fuentes de la ENCODAT {DATASET_YEAR}.
      </p>

      <div className="method-layout mt-8"><aside className="method-nav"><nav className="hidden lg:block" aria-label="En esta página"><div className="kicker mb-4">En esta página</div>{sections.map(t=><a key={t} href={`#${sectionId(t)}`}>{t}</a>)}</nav><details className="lg:hidden"><summary className="btn btn-secondary">En esta página</summary><nav aria-label="Secciones de metodología">{sections.map(t=><a key={t} href={`#${sectionId(t)}`}>{t}</a>)}</nav></details></aside><article className="min-w-0">
      <H>Diseño de la encuesta</H>
      <P>
        La ENCODAT {DATASET_YEAR} utiliza un diseño <strong>probabilístico, multietápico, estratificado
        y por conglomerados</strong>, con representatividad <strong>nacional, regional y por tipo de
        localidad</strong> (urbano/rural). La muestra de estudio (entrevistas completas) fue de
        3,847 adolescentes (12–17 años) y 15,353 personas adultas (18–65 años).
      </P>

      <H>Ponderación</H>
      <P>
        Cada persona tiene un <strong>ponderador de selección</strong> (variable <code>ponde_f</code>)
        que expande la muestra a la población. Todas las prevalencias y medias son promedios ponderados con
        ese factor. La suma de ponderadores reproduce la población de 12 a 65 años. La <strong>población (N)</strong> que
        se muestra es la estimación ponderada; el tamaño de muestra sin ponderar (<strong>n</strong>) se conserva
        únicamente en las descargas CSV, no en las visualizaciones, para evitar confundir ambas magnitudes.
      </P>

      <H>Intervalos de confianza</H>
      <P>
        Los intervalos de confianza al 95% se calculan reconociendo el diseño complejo: estratos de
        varianza (<code>est_sel</code>) y unidades primarias de muestreo (<code>mi_upm</code>),
        mediante <strong>linealización de Taylor</strong> (estimador de conglomerado último). Para
        proporciones se usa una transformación logit, de modo que los límites nunca salen del rango
        0–100%. Los grados de libertad del diseño son #UPM − #estratos. Como verificación
        independiente, los errores estándar se contrastaron con un <strong>bootstrap Rao–Wu</strong>,
        con concordancia cercana.
      </P>

      <H>Coeficiente de variación (CV)</H>
      <P>
        El CV (error estándar relativo, en %) acompaña a cada estimación como medida de precisión:
        a menor CV, mayor precisión. El Resumen Ejecutivo no define un umbral de CV, por lo que
        <strong> no se impone un corte inventado</strong>; se muestra el valor y el intervalo para
        que cada quien juzgue. Las estimaciones regionales por sexo y edad, con muestras pequeñas,
        tienden a tener CV más altos e intervalos más amplios.
      </P>

      <H>Medias y escalas</H>
      <P>
        Además de prevalencias (%), se incluyen <strong>medias</strong> como la edad de inicio de consumo, con su
        error estándar por linealización de Taylor. Tres indicadores provienen de <strong>escalas validadas</strong>:
        el malestar psicológico usa la escala <strong>K10</strong> (suma de 10 reactivos, corte ≥ 25); el juego
        problemático usa la escala <strong>GDIT</strong> (participantes con ≥ 15 puntos); y el trastorno por
        videojuegos usa los criterios <strong>IGD</strong> (≥ 5 de 9 criterios reportados como “a menudo” o “muy a
        menudo”). Cada indicador declara su <strong>base</strong> (denominador): población total, consumidores en el
        último año, participantes en juegos, víctimas de violencia, etc.
      </P>

      <H>Definiciones operacionales y validación</H>
      <P>
        Cada indicador se construye con la <strong>definición operacional</strong> del informe (Cuadros
        Suplementarios 1, 2 y 4) y se compara con la cifra publicada. El uso de drogas ilícitas “alguna vez” se
        confirma con la edad de inicio (DI1x = ‘Sí’ y DI4x), regla que reproduce las cifras oficiales. Donde el
        informe aplica además una <strong>reclasificación cualitativa</strong> de respuestas escritas —revisión por
        personas expertas— que no es reproducible con las variables públicas (drogas médicas, en especial opioides),
        o donde una definición compuesta admite lecturas (consumo excesivo de alcohol, dependencia), se usa la regla
        documentada y <strong>se registra la diferencia</strong> con una insignia de validación
        (<em>coincide / aproximado / difiere</em>). Nunca se ajusta ni se inventa una cifra para forzar la
        coincidencia.
      </P>

      <H>Correlaciones (co-ocurrencia individual)</H>
      <P>
        La pestaña de correlaciones mide con qué fuerza <strong>co-ocurren</strong>, en las mismas personas, pares de
        indicadores binarios con base poblacional. Para cada par se calcula, con el diseño complejo, la razón de
        momios (OR), el coeficiente phi, el <em>lift</em> y las probabilidades condicionales; la significancia se
        estima por <strong>bootstrap Rao–Wu</strong> (remuestreo de UPM dentro de estratos). Estas medidas son
        <strong> descriptivas y no implican causalidad</strong>: no controlan por edad, sexo u otros factores, y al
        evaluar cientos de pares algunos resultados significativos pueden deberse al azar. Los pares casi anidados por
        definición se marcan y pueden ocultarse.
      </P>

      <H>Interpretación de las estimaciones</H>
      <P>
        El reporte considera tres temporalidades de consumo: <strong>alguna vez en la vida</strong>,
        <strong> en el último año</strong> y <strong>en el último mes</strong>. Una diferencia entre
        grupos es <em>descriptiva</em> salvo que exista respaldo estadístico; en este explorador se
        señala cuando los intervalos de confianza se traslapan, y nunca se declara significancia solo
        porque dos valores difieran.
      </P>

      <H>Alcance de esta versión y datos faltantes</H>
      <P>
        Esta versión presenta el nivel <strong>nacional y por 9 regiones</strong>, que es el
        dominio de representatividad del diseño, para los indicadores de los capítulos 1 (drogas), 2 (alcohol) y
        4 (salud mental). La mayoría de las estimaciones nacionales reproducen el informe oficial al redondeo; el
        estado de validación (coincide / aproximado / difiere) se muestra explícitamente en cada indicador.
      </P>
      <ul className="list-disc pl-6 text-[15px] text-ink/90 max-w-measure space-y-1">
        <li>El nivel por <strong>entidad federativa</strong> se difiere: la encuesta no está diseñada para representatividad estatal y el Resumen Ejecutivo no publica cifras estatales.</li>
        <li>{EXCLUDED.map((e) => `${e.name} (${e.reason.toLowerCase()})`).join("; ")}: aparece como “no incluido”, sin valor imputado.</li>
        <li>No hay microdatos de 2016 en esta versión; la comparación temporal se incorporará cuando estén disponibles (el modelo ya contempla el campo <code>year</code>).</li>
        <li>El mapa usa el <strong>contorno geográfico</strong> de los estados, coloreados según el valor de <em>su región</em> (la encuesta no produce estimaciones por entidad). Los datos siempre provienen de la ENCODAT.</li>
      </ul>

      <H>Trazabilidad</H>
      <P>
        Cada cifra puede rastrearse sin ambigüedad: microdato → estimación ponderada → tabla
        normalizada → gráfica → tooltip → tabla visible → CSV descargado, con el mismo valor en todas
        las etapas. La gráfica y la tabla usan exactamente la misma observación del dataset.
      </P>
      </article></div>
    </div>
  );
}
