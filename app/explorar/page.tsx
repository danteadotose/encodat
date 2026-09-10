import { Suspense } from "react";
import { ExploreView } from "@/components/ExploreView";
export default function ExplorarPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-12">
      <Suspense fallback={<div className="text-subink">Cargando…</div>}><ExploreView /></Suspense>
    </div>
  );
}
