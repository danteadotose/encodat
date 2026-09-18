"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="report-shell">
    <div className="report-intro" role="alert">
      <span className="kicker">Error de carga</span>
      <h1>No se pudo cargar la consulta</h1>
      <p className="report-standfirst">
        Los resultados no llegaron a cargarse. Es un fallo de carga, no una ausencia de datos: vuelve a
        intentarlo y, si persiste, consulta la tabla completa.
      </p>
      <div className="report-intro-bottom">
        <div className="flex gap-3 flex-wrap">
          <button type="button" className="btn btn-primary" onClick={reset}>Volver a intentar</button>
          <a className="btn btn-secondary" href="/datos">Ir a la tabla de resultados</a>
          <a className="btn btn-secondary" href="/">Ir al informe</a>
        </div>
      </div>
    </div>
  </div>;
}
