"use client";
export default function TemporalError({ reset }: { reset: () => void }) {
  return (
    <section role="alert" className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="text-2xl font-semibold">No se pudieron cargar las comparaciones</h1>
      <p className="my-4">Los resultados no están disponibles en este momento. Puedes volver a intentarlo.</p>
      <button onClick={reset}
        className="min-h-[44px] rounded-md border border-current/25 px-4 py-2 font-medium hover:bg-current/5 focus-visible:outline focus-visible:outline-[3px]">
        Reintentar
      </button>
    </section>
  );
}
