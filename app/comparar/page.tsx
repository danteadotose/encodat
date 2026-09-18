import { Suspense } from "react";
import { TemporalComparison } from "@/components/TemporalComparison";

export const metadata = {
  title: "Comparar ediciones · ENCODAT",
  description: "Comparación de ENCODAT 2016–2017 y 2025 por región: prevalencias con IC 95 %, diferencias en puntos porcentuales, comparabilidad y método.",
};

export default function CompararPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-12">
      <Suspense fallback={<p role="status" aria-live="polite">Cargando comparaciones validadas…</p>}>
        <TemporalComparison />
      </Suspense>
    </div>
  );
}
