import { Suspense } from "react";
import { RECORDS, INDICATORS } from "@/lib/data";
import { DataTable } from "@/components/DataTable";
export default function DatosPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-12">
      <div className="mb-7">
        <div className="kicker mb-1.5">Datos</div>
        <h1 className="font-display text-[2.4rem] font-bold text-ink">Tabla de resultados</h1>
        <p className="text-subink mt-3 max-w-measure text-[15px]">
          Todas las estimaciones disponibles ({RECORDS.length.toLocaleString("es-MX")} filas) para {INDICATORS.length} indicadores
          de los capítulos 1 (drogas), 2 (alcohol) y 4 (salud mental). Busca, filtra, ordena y descarga.
          Las prevalencias y medias están ponderadas con el diseño complejo; el tamaño de muestra sin ponderar (n)
          se incluye únicamente en la descarga CSV.
        </p>
      </div>
      <Suspense fallback={<p>Cargando resultados…</p>}><DataTable rows={RECORDS} filename="encodat2025_todos.csv" showIndicator /></Suspense>
    </div>
  );
}
