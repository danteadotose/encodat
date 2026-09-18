export default function Loading() {
  return <div className="report-shell">
    <div className="report-intro" role="status" aria-live="polite">
      <span className="kicker">Cargando</span>
      <h1>Preparando los resultados…</h1>
      <p className="report-standfirst">Se están cargando las estimaciones publicables y sus fuentes.</p>
    </div>
  </div>;
}
