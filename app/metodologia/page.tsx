import Link from "next/link";
import {
  REGIONS, EXCLUDED, REGIONS_NOTE, RECORDS, INDICATORS, RESULT_INDICATOR_IDS,
  DERIVED_VARIABLES, SYNTAX_SOURCE_VALUES, SYNTAX_GAPS, syntaxSourceCounts, AUDIT_DATE,
} from "@/lib/data";
import { SYNTAX_SOURCE_LABEL } from "@/lib/format";
import { ReportNav, ReportSection, MethodDisclosure, Availability, SyntaxSourceTag } from "@/components/Report";

export const metadata = {
  title: "Metodología y alcance · ENCODAT",
  description: "Fuentes, validación, procedencia de las variables derivadas, significado de cada N ponderada, incertidumbre y unidad geográfica regional.",
};

const SECTIONS = [
  { id: "fuentes", label: "Fuentes y validación" },
  { id: "derivacion", label: "Procedencia de las definiciones" },
  { id: "poblacion", label: "N ponderada" },
  { id: "incertidumbre", label: "IC y precisión" },
  { id: "geografia", label: "Regiones" },
  { id: "otros-analisis", label: "Otros análisis" },
];

export default function MetodologiaPage() {
  const counts = syntaxSourceCounts();
  const derived = Object.values(DERIVED_VARIABLES);
  const oficiales = derived.filter(d => d.syntax_source === "oficial").length;
  const propias = derived.length - oficiales;
  return <div className="report-shell">
    <header className="report-intro">
      <span className="kicker">Fuentes y métodos</span>
      <h1>Cómo leer estas cifras</h1>
      <p className="report-standfirst">
        Definiciones, procedencia, población, incertidumbre y alcance de la validación. Lo que falta aparece
        nombrado como faltante: ninguna cifra se ajusta para coincidir con una publicación.
      </p>
      <div className="report-updated">
        <span>Revisión de disponibilidad: {AUDIT_DATE}</span>
        <span>{RECORDS.length.toLocaleString("es-MX")} estimaciones publicables</span>
        <span>{RESULT_INDICATOR_IDS.length} de {INDICATORS.length} indicadores con cifra</span>
      </div>
    </header>
    <div className="report-layout">
      <ReportNav items={SECTIONS} label="En esta página" />
      <article className="report-body">

        <ReportSection id="fuentes" title="Fuentes y validación">
          <p className="report-prose">
            El sitio consulta resultados precalculados por la capa de análisis. La revisión combina el informe
            completo de la encuesta, los catálogos de variables, las reglas de derivación y la reproducción de
            estimaciones. Cada fila publicada conserva su localizador de fuente.
          </p>
          <p className="report-prose">
            Se publican {RECORDS.length.toLocaleString("es-MX")} celdas, de {RESULT_INDICATOR_IDS.length}{" "}
            indicadores. El catálogo completo de {INDICATORS.length} permanece consultable; los indicadores sin
            evidencia suficiente muestran su estado de disponibilidad y su motivo, sin cifra.
          </p>
          <MethodDisclosure title="Consultar la evidencia">
            <div className="flex flex-col items-start">
              <a className="text-link" href="https://encuestas.insp.mx/repositorio/encuestas/ENCODAT2025/doctos/informes/251223_ENCODAT_completo.pdf" target="_blank" rel="noreferrer">Informe completo ENCODAT 2025</a>
              <a className="text-link" href="/validation/validacion_fuentes.md" download>Informe de verificación de fuentes</a>
              <a className="text-link" href="/validation/fuentes_verificadas.csv" download>Celdas de referencia verificadas</a>
              <a className="text-link" href="/validation/disponibilidad.json" download>Registro de disponibilidad por celda</a>
            </div>
          </MethodDisclosure>
          <Availability state="disponible" title="Qué significa «publicable» aquí">
            Una coincidencia con una cifra publicada respalda esa celda concreta. Los desgloses adicionales se
            habilitan solo si hay evidencia de su definición, de su diseño y de su reproducción. Una etiqueta
            histórica de «coincide» no certifica el indicador completo.
          </Availability>
        </ReportSection>

        <ReportSection id="derivacion" title="De dónde viene la definición de cada indicador"
          description="La encuesta se analiza con variables derivadas (_av alguna vez, _ua último año, _um último mes, _ini edad de inicio). El proyecto distingue, variable por variable, si esa derivación consta en la sintaxis oficial o es una reconstrucción propia.">
          <div className="tag-row">
            <SyntaxSourceTag source="oficial" />
            <SyntaxSourceTag source="reconstruccion_proyecto" />
          </div>
          <dl className="report-prose mt-5">
            {Object.entries(SYNTAX_SOURCE_VALUES).map(([k, v]) => (
              <div key={k} className="mt-3">
                <dt className="font-semibold text-ink">{SYNTAX_SOURCE_LABEL[k as "oficial" | "reconstruccion_proyecto"] ?? k} (<code>{k}</code>)</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="report-prose mt-5">
            En el catálogo de indicadores, <strong>{counts.oficial}</strong> declaran procedencia oficial y{" "}
            <strong>{counts.reconstruccion_proyecto}</strong> declaran derivación propia del proyecto
            {counts.sin_declarar > 0 && <>, y {counts.sin_declarar} no declaran procedencia</>}. En la capa de
            variables derivadas hay <strong>{derived.length}</strong> variables: <strong>{oficiales}</strong> con
            sentencia literal de la sintaxis oficial y <strong>{propias}</strong> reconstruidas por el proyecto.
          </p>
          <Availability state="pendiente" title="Partes de la sintaxis oficial que no están disponibles">
            <ul className="mt-2 list-disc pl-5">
              {SYNTAX_GAPS.map(g => <li key={g} className="mt-1">{g}</li>)}
            </ul>
            <p>
              Mientras falten, el proyecto conserva su definición vigente, la marca como derivación propia y no
              la presenta como oficial. Cuando llegue el texto completo se sustituye la derivación, no la cifra.
            </p>
          </Availability>
          <h3 className="font-semibold text-lg mt-8">Las {derived.length} variables derivadas</h3>
          <div className="table-scroll mt-3" role="region" aria-label="Variables derivadas y su procedencia, con desplazamiento" tabIndex={0} style={{ maxHeight: "32rem" }}>
            <table>
              <caption className="sr-only">Nombre oficial de cada variable derivada, su etiqueta oficial, el bloque al que pertenece y la procedencia de su derivación.</caption>
              <thead><tr>
                <th scope="col">Variable</th><th scope="col">Etiqueta oficial</th>
                <th scope="col">Bloque</th><th scope="col">Procedencia</th><th scope="col">Variables de origen</th>
              </tr></thead>
              <tbody>
                {derived.map(d => (
                  <tr key={d.derived_variable}>
                    <td><code>{d.derived_variable}</code></td>
                    <td>{d.official_label ?? "No disponible"}</td>
                    <td>{d.block ?? "No disponible"}</td>
                    <td>{d.syntax_source === "oficial" ? "Sintaxis oficial" : "Derivación del proyecto"}{d.depends_on_reconstruction ? " · depende de una reconstrucción" : ""}</td>
                    <td className="text-xs">{d.source_variables?.length ? d.source_variables.join(", ") : "No disponible"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="table-note">
            «Depende de una reconstrucción» marca una variable cuya propia sentencia es literal pero que consume
            una entrada reconstruida por el proyecto: se declara por transitividad, no se oculta.
          </p>
        </ReportSection>

        <ReportSection id="poblacion" title="N ponderada: dos significados que no se mezclan">
          <dl className="report-prose">
            <div>
              <dt className="font-semibold text-ink">Población estimada de la categoría</dt>
              <dd>
                N ponderada de las personas que cumplen la definición del indicador. Se usa el conteo de la
                fuente cuando está disponible y no se reconstruye a partir del porcentaje. En las descargas es
                <code>weighted_n</code>, con su significado en <code>weighted_n_meaning</code>.
              </dd>
            </div>
            <div className="mt-4">
              <dt className="font-semibold text-ink">Población estimada del universo analítico</dt>
              <dd>
                Suma de ponderadores dentro de la base del indicador, del sexo, de la edad y del territorio: el
                denominador. En el archivo de origen es <code>pop</code>; en las descargas,
                <code>weighted_denominator_n</code>.
              </dd>
            </div>
          </dl>
          <p className="report-prose mt-4">
            Toda N que aparece en tarjetas, gráficas, tablas, fichas al pasar el cursor y descargas es ponderada
            y lleva una de esas dos etiquetas: la interfaz no admite una N sin declarar su tipo. Si falta, se
            escribe «No disponible». Nunca se sustituye por el número de casos de la muestra, ni se confunde el
            numerador con el denominador, ni se deduce dividiendo una población entre un porcentaje redondeado.
          </p>
          <p className="report-prose mt-4">
            Las N muestrales no se muestran en la interfaz. Una N ponderada jamás se usa como tamaño de muestra
            para errores estándar ni para pruebas.
          </p>
        </ReportSection>

        <ReportSection id="incertidumbre" title="Incertidumbre y precisión">
          <p className="report-prose">
            Las estimaciones de 2025 emplean el factor de expansión <code>ponde_f</code>, los estratos de
            varianza <code>est_sel</code> y las UPM <code>mi_upm</code>. La capa de análisis obtiene errores
            estándar por linealización de Taylor e intervalos logit para proporciones. El navegador conserva
            esos valores: no genera ninguna estimación.
          </p>
          <p className="report-prose mt-3">
            La precisión se clasifica por coeficiente de variación: moderada entre 15 % y menos de 30 %, baja a
            partir de 30 %. Un CV ausente se muestra como «No disponible» y no permite afirmar la precisión. Los
            intervalos degenerados no se presentan como evidencia de ausencia.
          </p>
          <p className="report-prose mt-3">
            Una diferencia visual entre dos puntos no establece significancia, y el solapamiento de intervalos
            no sustituye un contraste. Cuando se evalúa un contraste, los únicos estados admitidos son:
            <strong> cambio con evidencia estadística</strong>, <strong>sin evidencia suficiente de cambio</strong>{" "}
            y <strong>comparación no evaluable</strong>. «Sin evidencia suficiente» no se redacta como «iguales».
          </p>
        </ReportSection>

        <ReportSection id="geografia" title="La unidad de análisis territorial es la región"
          description="Las entidades federativas se usan únicamente para construir y documentar los contornos del mapa. No se publican estimaciones por entidad.">
          <p className="report-prose">{REGIONS_NOTE}</p>
          <div className="table-scroll mt-4" role="region" aria-label="Composición de las regiones" tabIndex={0}>
            <table>
              <caption className="sr-only">Cada región con las entidades federativas que la componen.</caption>
              <thead><tr><th scope="col">Región</th><th scope="col">Entidades que la componen</th></tr></thead>
              <tbody>{REGIONS.map(r => <tr key={r.region_id}><td>{r.name}</td><td>{r.entidades.map(e => e.name).join(", ")}</td></tr>)}</tbody>
            </table>
          </div>
          {EXCLUDED.length > 0 && (
            <Availability state="no-disponible" title="Cobertura incompleta declarada">
              {EXCLUDED.map(e => <p key={e.cve_ent}><strong>{e.name}</strong>: {e.reason}</p>)}
              <p>
                Se representa como «no incluido en la encuesta», hachurado en el mapa, y nunca imputado. La
                referencia nacional conserva esa cobertura aunque se seleccione una región.
              </p>
            </Availability>
          )}
        </ReportSection>

        <ReportSection id="otros-analisis" title="Comparaciones entre ediciones y asociaciones">
          <div className="report-feature-link">
            <div>
              <h3>2016–2017 frente a 2025</h3>
              <p>
                La comparabilidad depende de la pregunta, del universo y del territorio. Cada par declara si la
                comparación es evaluable, y con qué evidencia, antes de mostrar una diferencia.
              </p>
            </div>
            <Link className="btn btn-primary" href="/comparar">Ver comparación</Link>
          </div>
          <div className="mt-6">
            <h3 className="font-semibold text-lg">Asociaciones entre indicadores</h3>
            <p className="report-description mt-2">
              La selección de pares excluye dependencias estructurales sustentadas en las definiciones. Una
              correlación observada alta no constituye por sí misma un motivo de exclusión. El registro de
              exclusiones y el método de los pares habilitados son descargables.
            </p>
            <Link className="text-link" href="/correlaciones">Consultar asociaciones y exclusiones →</Link>
          </div>
        </ReportSection>

      </article>
    </div>
  </div>;
}
