import { Suspense } from "react";
import { ExploreView } from "@/components/ExploreView";

export const metadata = {
  title: "Explorar indicadores · ENCODAT",
  description: "Consulta un indicador de ENCODAT: referencia nacional, grupos de población y las nueve regiones, con IC 95 %, precisión y N ponderadas etiquetadas.",
};

export default function ExplorarPage() {
  return (
    <div className="report-shell py-8 sm:py-10">
      <Suspense fallback={<p className="report-standfirst" role="status" aria-live="polite">Cargando el indicador y sus fuentes…</p>}>
        <ExploreView />
      </Suspense>
    </div>
  );
}
