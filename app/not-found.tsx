import Link from "next/link";
export default function NotFound() {
  return <div className="report-shell">
    <div className="report-intro">
      <span className="kicker">ENCODAT · 404</span>
      <h1>No encontramos esta sección</h1>
      <p className="report-standfirst">
        La dirección no corresponde a ninguna sección del informe. Desde el índice puedes llegar a los
        indicadores, a la tabla completa y a la metodología.
      </p>
      <div className="report-intro-bottom">
        <div className="flex gap-3 flex-wrap">
          <Link className="btn btn-primary" href="/">Volver al informe</Link>
          <Link className="btn btn-secondary" href="/explorar">Explorar indicadores</Link>
          <Link className="btn btn-secondary" href="/metodologia">Metodología</Link>
        </div>
      </div>
    </div>
  </div>;
}
