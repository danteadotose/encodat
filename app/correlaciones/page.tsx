import { Suspense } from "react";
import { Correlations } from "@/components/Correlations";
export default function CorrelacionesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-12">
      <Suspense fallback={<p>Cargando correlaciones…</p>}><Correlations /></Suspense>
    </div>
  );
}
