import { Suspense } from "react";
import Link from "next/link";
import { RECORDS, RESULT_INDICATOR_IDS, INDICATORS, AUDIT_DATE } from "@/lib/data";
import { DataTable } from "@/components/DataTable";
import { Availability, MethodDisclosure } from "@/components/Report";

export const metadata = {
  title: "Datos y descargas · ENCODAT",
  description: "Tabla completa de estimaciones publicables de ENCODAT, con IC 95 %, CV y N ponderadas etiquetadas por significado.",
};

export default function DatosPage() {
  return <div className="report-shell">
    <header className="report-intro">
      <span className="kicker">Consulta y descarga</span>
      <h1>Tabla de resultados</h1>
      <p className="report-standfirst">
        {RECORDS.length.toLocaleString("es-MX")} estimaciones publicables, de {RESULT_INDICATOR_IDS.length} de
        los {INDICATORS.length} indicadores del catálogo. Filtra por indicador, región, sexo o edad; ordena por
        cualquier columna. La descarga conserva los valores de la fuente sin redondearlos y respeta el orden y
        los filtros de la pantalla.
      </p>
      <div className="report-updated">
        <span>Revisión de disponibilidad: {AUDIT_DATE}</span>
        <span>Unidad geográfica: región</span>
        <span>Sin estimaciones por entidad federativa</span>
      </div>
    </header>
    <div className="py-8">
      <Availability state="disponible" title="Las dos N ponderadas, y qué significa cada una">
        <p>
          <strong>Población estimada de la categoría</strong>: personas que cumplen la definición del indicador,
          expandidas con el ponderador. <strong>Población estimada del universo analítico</strong>: el
          denominador del indicador, la población base expandida.
        </p>
        <p>
          Ninguna de las dos es un número de casos de la muestra, y una N ausente se lee «No disponible»: no se
          sustituye por la n muestral ni se deduce dividiendo la población entre un porcentaje redondeado.
        </p>
      </Availability>
      <div className="mt-8">
        <Suspense fallback={<p role="status" aria-live="polite">Cargando la tabla de resultados…</p>}>
          <DataTable rows={RECORDS} filename="encodat2025_resultados_publicables.csv" showIndicator />
        </Suspense>
      </div>
      <MethodDisclosure title="Qué no está en esta tabla">
        <p>
          Las celdas sin evidencia de validación no aparecen aquí. Siguen consultables en la ficha de cada
          indicador, con su estado de disponibilidad y su motivo, y sin cifra.
        </p>
        <p>
          Las columnas de la descarga son las mismas de la pantalla más los dos nombres explícitos de N:
          <code>weighted_n</code> con <code>weighted_n_meaning</code>, y <code>weighted_denominator_n</code> con
          <code>weighted_denominator_meaning</code>.
        </p>
        <div className="flex gap-4 flex-wrap mt-3">
          <Link className="text-link" href="/metodologia">Metodología y alcance</Link>
          <Link className="text-link" href="/explorar">Explorar un indicador</Link>
        </div>
      </MethodDisclosure>
    </div>
  </div>;
}
