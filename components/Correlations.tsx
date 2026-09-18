'use client';
import React, { useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  ReportSection, FigureCard, Availability, MethodDisclosure,
  EstimateValue, WeightedN, FilterBar, SyntaxSourceTag,
} from '@/components/Report';
import { Card } from './ui';
import { ClientReady, ShareView } from './Controls';
import {
  CORRELATIONS as D, REVIEW_STATUS, ANALYTICAL_STATUS, matchesPair,
  analyticalCSV, reviewCSV, downloadCorrelationCSV, evidenceLabel, EVIDENCE_LABEL,
  evidenceLine, reportablePairs, withheldPairs, exclusions, pendingPairs,
  exclusionsByReason, pendingByReason,
} from '@/lib/correlations';
import type { CorrelationResult, ReviewedPair, ReviewStatus } from '@/lib/correlations';

const num = (n: number | null | undefined, d = 2) =>
  n == null ? 'No disponible' : n.toLocaleString('es-MX', { maximumFractionDigits: d, minimumFractionDigits: d });
const interval = (a: number | null, b: number | null, d = 2) =>
  a == null || b == null ? 'No disponible' : `${num(a, d)} a ${num(b, d)}`;
const pvalue = (p: number | null) => (p == null ? 'No disponible' : p < 0.001 ? '< 0.001' : num(p, 3));

const STATUS_ORDER: ReviewStatus[] = ['excluded', 'definition_pending', 'candidate'];

/* ---------------- gráfica de phi con IC 95 % ---------------- */
function PhiForest({ rows }: { rows: CorrelationResult[] }) {
  if (!rows.length) return null;
  const rowH = 26;
  const height = rows.length * rowH + 42;
  const x = (v: number) => 236 + v * 200;
  return (
    <svg viewBox={`0 0 460 ${height}`} className="w-full" role="img"
      aria-label={`Coeficiente phi con intervalo de confianza al 95 % de ${rows.length} pares de indicadores`}
      style={{ color: 'var(--accent)' }}>
      <line x1={x(0)} x2={x(0)} y1="8" y2={rows.length * rowH + 8} stroke="currentColor" strokeOpacity=".35" strokeDasharray="3 3" />
      {rows.map((r, i) => {
        const y = 8 + i * rowH + rowH / 2;
        const label = `${r.a_label} y ${r.b_label}`;
        return (
          <g key={r.pair_id}>
            <text x="0" y={y + 4} fontSize="10.5" fill="var(--ink)">
              {label.length > 46 ? `${label.slice(0, 45)}…` : label}
            </text>
            {r.phi_ci_low != null && r.phi_ci_high != null && (
              <line x1={x(r.phi_ci_low)} x2={x(r.phi_ci_high)} y1={y} y2={y}
                stroke="currentColor" strokeOpacity=".55" strokeWidth="2.5" />
            )}
            {r.phi != null && (
              <circle cx={x(r.phi)} cy={y} r="4" fill="currentColor">
                <title>{`${label} · phi ${num(r.phi, 3)} · IC 95 % ${interval(r.phi_ci_low, r.phi_ci_high, 3)}`}</title>
              </circle>
            )}
          </g>
        );
      })}
      <g fontSize="10" fill="var(--subink)">
        {[-0.2, 0, 0.2, 0.4, 0.6].map((t) => (
          <text key={t} x={x(t)} y={rows.length * rowH + 30} textAnchor="middle">{t}</text>
        ))}
        <text x={x(0)} y={rows.length * rowH + 42} textAnchor="middle" fontSize="9.5">
          Coeficiente phi (0 = sin asociación)
        </text>
      </g>
    </svg>
  );
}

/* ---------------- barras de exclusiones por tipo ---------------- */
function ReasonBars({ items }: { items: { code: string; label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ul className="space-y-3" aria-label="Pares excluidos por tipo de dependencia">
      {items.map((i) => (
        <li key={i.code}>
          <div className="flex items-baseline justify-between gap-3 min-w-0">
            <code className="text-xs break-all">{i.code}</code>
            <span className="tnum text-sm font-semibold">{i.count}</span>
          </div>
          <div className="h-2 mt-1 rounded-full" role="presentation" style={{ background: 'var(--line)' }}>
            <div className="h-2 rounded-full" style={{ width: `${(i.count / max) * 100}%`, background: 'var(--accent)' }} />
          </div>
          <p className="text-xs mt-1 opacity-75">{i.label}</p>
        </li>
      ))}
    </ul>
  );
}

function ReviewRow({ r }: { r: ReviewedPair }) {
  return (
    <details className="report-disclosure">
      <summary>
        <span className="tnum">{r.a_label} · {r.b_label}</span>
      </summary>
      <div>
        <dl>
          <dt>Estado</dt><dd>{REVIEW_STATUS[r.status]} · {ANALYTICAL_STATUS[r.analytical_status]}</dd>
          <dt>Motivo tipificado</dt><dd><code className="break-all">{r.reason_code}</code> — {r.reason_family}</dd>
          <dt>Motivo de este par</dt><dd>{r.reason}</dd>
          <dt>Variables derivadas</dt>
          <dd className="flex flex-wrap gap-2">
            <SyntaxSourceTag source={r.a_syntax_source} variable={r.a_derived_variable ?? undefined} compact />
            <SyntaxSourceTag source={r.b_syntax_source} variable={r.b_derived_variable ?? undefined} compact />
          </dd>
          <dt>Evidencia</dt>
          <dd><ul className="list-disc pl-5 space-y-1">{r.evidence.map((e, i) => <li key={i} className="break-words text-xs">{evidenceLine(e)}</li>)}</ul></dd>
          {r.release_gate_reason && (<><dt>Puerta de liberación</dt><dd>{r.release_gate_reason}</dd></>)}
        </dl>
      </div>
    </details>
  );
}

export function Correlations() {
  const sp = useSearchParams();
  const pathname = usePathname();
  const [downloadError, setDownloadError] = useState('');

  const indicator = D.indicators.some((i) => i.id === sp.get('indicador')) ? sp.get('indicador')! : 'all';
  const search = sp.get('buscar') ?? '';
  const status = (STATUS_ORDER as string[]).includes(sp.get('estado') ?? '') ? sp.get('estado')! : 'all';
  const view = sp.get('vista') === 'tabla' ? 'tabla' : 'grafica';

  const set = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(window.location.search);
    p.delete('pagina');
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    window.history.replaceState(null, '', `${pathname}?${p}`);
  };
  const reset = () => window.history.replaceState(null, '', pathname);

  const results = useMemo(
    () => reportablePairs().filter((r) => matchesPair(r, indicator, search))
      .sort((a, b) => Math.abs(b.phi ?? 0) - Math.abs(a.phi ?? 0)),
    [indicator, search],
  );
  const withheld = useMemo(() => withheldPairs().filter((r) => matchesPair(r, indicator, search)), [indicator, search]);
  const reviewed = useMemo(
    () => D.review.filter((r) => matchesPair(r, indicator, search) && (status === 'all' || r.status === status)),
    [indicator, search, status],
  );
  const excluded = useMemo(() => exclusions().filter((r) => matchesPair(r, indicator, search)), [indicator, search]);
  const pending = useMemo(() => pendingPairs().filter((r) => matchesPair(r, indicator, search)), [indicator, search]);

  const pages = Math.max(1, Math.ceil(reviewed.length / 20));
  const requested = Number(sp.get('pagina') ?? 1);
  const page = Number.isInteger(requested) ? Math.max(1, Math.min(pages, requested)) : 1;
  const changePage = (n: number) => {
    const p = new URLSearchParams(window.location.search);
    p.set('pagina', String(n));
    window.history.replaceState(null, '', `${pathname}?${p}`);
  };

  const download = (name: string, build: () => string) => {
    try { setDownloadError(''); downloadCorrelationCSV(name, build()); }
    catch (e) { setDownloadError(e instanceof Error ? e.message : 'No se pudo preparar la descarga.'); }
  };

  const validation = D.calculation_validation;
  const gate = D.release_gate;

  return (
    <div className="space-y-10">
      <ClientReady />
      <header>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <span className="chip">Asociaciones entre personas · Nacional</span>
          <ShareView href={`${pathname}?${sp}`} />
        </div>
        <h1 className="font-display text-[2.4rem] sm:text-[2.75rem] leading-[1.08] font-bold text-ink">
          ¿Qué condiciones coexisten en las mismas personas?
        </h1>
        <p className="text-subink mt-4 max-w-measure">
          La unidad de análisis es <strong>la persona</strong>: cada par es una tabla de contingencia sobre los mismos
          individuos de 12 a 65 años. {D.analysis_unit_note.split('. ').slice(1).join('. ')}
        </p>
        <p className="text-sm text-subink mt-3 max-w-measure">
          Se retiran del análisis los pares cuya asociación la produce la construcción de las variables. La decisión no
          usa el valor de phi, ni el cociente de momios, ni el valor p, ni ningún umbral: usa el grafo de variables
          derivadas, la sintaxis oficial y los saltos del cuestionario.
        </p>
      </header>

      <FilterBar
        title="Selección de pares"
        nationalScopeNote={false}
        onReset={reset}
        groups={[
          {
            id: 'estado', label: 'Estado de la revisión', value: status, control: 'segmented',
            onChange: (v) => set({ estado: v === 'all' ? null : v }),
            options: [
              { value: 'all', label: 'Todos', hint: `${D.counts.candidate_universe} pares del universo` },
              { value: 'excluded', label: 'Excluidos', hint: `${D.counts.excluded_total} con dependencia demostrada` },
              { value: 'definition_pending', label: 'Pendientes', hint: `${D.counts.definitions_pending_total} sin definición resuelta` },
              { value: 'candidate', label: 'Conservados', hint: `${D.counts.candidates_total} sin dependencia estructural` },
            ],
            note: 'El estado se refiere a la revisión de construcción, no a la fuerza de la asociación.',
          },
          {
            id: 'indicador', label: 'Indicador', value: indicator, control: 'select',
            onChange: (v) => set({ indicador: v === 'all' ? null : v }),
            options: [
              { value: 'all', label: 'Todos los indicadores' },
              ...D.indicators.map((i) => ({
                value: i.id,
                label: i.release_allowed ? i.label : `${i.label} (sin liberación de resultados)`,
                hint: i.derived_variable ? `Variable derivada ${i.derived_variable}` : 'Sin variable derivada oficial',
              })),
            ],
          },
        ]}
      >
        <label className="block">
          <span className="field-label">Buscar en las etiquetas del par</span>
          <input className="field w-full" type="search" value={search}
            onChange={(e) => set({ buscar: e.target.value || null })}
            placeholder="por ejemplo: suicida" />
        </label>
      </FilterBar>

      {downloadError && <Availability state="no-disponible" title="Descarga no realizada" reason={downloadError} />}

      {/* ---------------- 1. Registro de exclusiones ---------------- */}
      <ReportSection id="exclusiones" eyebrow="Sección 1" title="Qué se excluyó y con qué evidencia"
        description={D.selection_rules.principle}>
        <FigureCard
          number="1" title="Pares excluidos por tipo de dependencia estructural"
          description={`${D.counts.excluded_total} de los ${D.counts.candidate_universe} pares del universo quedan fuera de matrices, rankings, resúmenes y exportaciones. ${D.counts.excluded_previously_published} de ellos se publicaban antes de esta revisión.`}
          chart={<ReasonBars items={exclusionsByReason()} />}
          table={
            <div className="table-scroll">
              <table>
                <caption className="sr-only">Pares excluidos por tipo de dependencia</caption>
                <thead><tr><th scope="col">Motivo tipificado</th><th scope="col">Tipo de dependencia</th><th scope="col" className="tnum">Pares</th></tr></thead>
                <tbody>
                  {exclusionsByReason().map((i) => (
                    <tr key={i.code}><th scope="row"><code className="break-all">{i.code}</code></th><td>{i.label}</td><td className="tnum">{i.count}</td></tr>
                  ))}
                  <tr><th scope="row">Total</th><td>Dependencia estructural demostrada</td><td className="tnum">{D.counts.excluded_total}</td></tr>
                </tbody>
              </table>
            </div>
          }
          view={view} onViewChange={(v) => set({ vista: v === 'grafica' ? null : v })}
          onDownload={() => download('encodat_correlaciones_exclusiones.csv', () => reviewCSV(exclusions()))}
          downloadLabel="Descargar el registro de exclusiones"
          legend="Cada barra es un tipo de dependencia demostrable. Ningún tipo depende de la magnitud de la asociación."
          source={<>Evidencia: {D.selection_rules.evidence_sources.length} fuentes auditables en el repositorio.</>}
          notes={
            <p>
              Regla no aplicable en este módulo: <code className="break-all">{D.selection_rules.not_applicable[0].rule}</code> —{' '}
              {D.selection_rules.not_applicable[0].reason}
            </p>
          }
        />
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          {[
            ['Pares excluidos', D.counts.excluded_total, 'Dependencia estructural demostrada'],
            ['Definiciones pendientes', D.counts.definitions_pending_total, 'Nombradas una por una, sin excluir'],
            ['Pares conservados', D.counts.candidates_total, 'Sin dependencia estructural identificada'],
          ].map(([label, value, hint]) => (
            <Card key={String(label)} className="p-5">
              <p className="text-sm text-subink">{label}</p>
              <p className="text-3xl font-semibold text-ink tnum mt-2">{value}</p>
              <p className="text-xs text-faint mt-2">{hint}</p>
            </Card>
          ))}
        </div>
      </ReportSection>

      {/* ---------------- 2. Asociaciones conservadas ---------------- */}
      <ReportSection id="resultados" eyebrow="Sección 2" title="Asociaciones conservadas con cifras"
        description={`${D.counts.validated_results} pares recalculados y verificados de forma independiente. Se conservan porque no se demostró dependencia estructural, con independencia de que su asociación sea alta o baja.`}>
        {results.length === 0 ? (
          <Availability state="no-disponible" title="Ningún par con cifras en esta selección"
            reason="Cambia el indicador o borra la búsqueda. Solo publican cifras los pares entre indicadores liberados para resultados." />
        ) : (
          <FigureCard
            number="2" title="Coeficiente phi con intervalo de confianza al 95 %"
            description="Asociación entre dos condiciones en las mismas personas. Un phi positivo indica que coexisten más de lo esperado si fueran independientes. No demuestra causalidad ni está ajustado por edad, sexo u otros factores."
            chart={<PhiForest rows={results} />}
            table={
              <div className="table-scroll">
                <table>
                  <caption className="sr-only">Pares con resultados verificados</caption>
                  <thead>
                    <tr>
                      <th scope="col">Par</th><th scope="col">Prevalencia conjunta</th>
                      <th scope="col">phi (IC 95 %)</th><th scope="col">Momios (IC 95 %)</th>
                      <th scope="col">p ajustada (Holm)</th><th scope="col">Evidencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.pair_id}>
                        <th scope="row">{r.a_label} · {r.b_label}</th>
                        <td><EstimateValue estimate={r.prev_joint} ciLow={r.prev_joint_ci_low} ciHigh={r.prev_joint_ci_high}
                          cv={r.prev_joint_cv} reliability={r.prev_joint_precision ?? undefined} size="inline" /></td>
                        <td className="tnum">{num(r.phi, 3)}<br /><span className="text-xs opacity-70">{interval(r.phi_ci_low, r.phi_ci_high, 3)}</span></td>
                        <td className="tnum">{num(r.odds_ratio, 2)}<br /><span className="text-xs opacity-70">{interval(r.odds_ratio_ci_low, r.odds_ratio_ci_high, 2)}</span></td>
                        <td className="tnum">{pvalue(r.p_holm)}</td>
                        <td>{EVIDENCE_LABEL[evidenceLabel(r)]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
            view={view} onViewChange={(v) => set({ vista: v === 'grafica' ? null : v })}
            onDownload={() => download('encodat_correlaciones_resultados.csv', () => analyticalCSV(results))}
            downloadLabel="Descargar los resultados de la figura"
            legend={`${results.filter((r) => evidenceLabel(r) === 'evidencia').length} de ${results.length} pares mostrados tienen evidencia estadística tras el ajuste de Holm sobre la familia predeclarada de ${D.multiplicity.family_size} pares.`}
            source={<>Población de 12 a 65 años. {D.design?.note}</>}
            notes={
              <p>
                La evidencia se decide con el valor p ajustado, nunca con el solapamiento de intervalos. Un par sin
                evidencia suficiente <strong>no</strong> significa que no exista asociación.
              </p>
            }
            footer={
              <div className="grid sm:grid-cols-2 gap-4 mt-3">
                <WeightedN value={results[0].weighted_joint_n} kind="categoria"
                  hint={`Par con mayor phi mostrado: ${results[0].a_label} y ${results[0].b_label}`} />
                <WeightedN value={results[0].weighted_denominator_n} kind="universo"
                  hint="Universo analítico del par: personas con respuesta válida en los dos indicadores" />
              </div>
            }
          />
        )}
        <div className="mt-4">
          <Availability state="disponible" title="Unidades que usa el método, declaradas aparte"
            reason={`${D.design?.observations.toLocaleString('es-MX')} observaciones, ${D.design?.strata} estratos y ${D.design?.psus} UPM (${D.design?.singleton_strata} estratos con una sola UPM). Ninguna N ponderada se usa como tamaño de muestra.`} />
        </div>
      </ReportSection>

      {/* ---------------- 3. Sin cifras ---------------- */}
      <ReportSection id="sin-cifras" eyebrow="Sección 3" title="Pares calculados que no publican cifras"
        description={D.release_gate.rule}>
        {withheld.length === 0
          ? <Availability state="disponible" title="Ningún par retenido en esta selección" reason="Todos los pares calculados de la selección tienen sus dos indicadores liberados." />
          : (
            <>
              <Availability state="pendiente"
                title={`${withheld.length} pares calculados y verificados, sin cifras publicadas`}
                reason={`Se retienen porque ${Object.keys(gate.blocked_indicators).filter((i) => withheld.some((w) => w.a === i || w.b === i)).join(' y ')} no están liberados para resultados en el manifiesto. Siguen contando en el denominador del ajuste de multiplicidad: la familia no se reduce a posteriori.`} />
              <ul className="mt-4 space-y-2">
                {withheld.map((r) => (
                  <li key={r.pair_id} className="text-sm">
                    <strong>{r.a_label} · {r.b_label}</strong>
                    <span className="block text-xs opacity-75">{r.release_gate_reason}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        {pending.length > 0 && (
          <div className="mt-6 space-y-4">
            <Availability state="no-evaluable" title={`${pending.length} pares con la definición sin resolver`}
              reason="No se excluyen ni se calculan: la dependencia es plausible pero la evidencia disponible no la demuestra ni la descarta. Cada caso está nombrado con su motivo." />
            <ul className="space-y-2">
              {pendingByReason().map((i) => (
                <li key={i.code} className="text-sm">
                  <code className="text-xs break-all">{i.code}</code> · <span className="tnum">{i.count}</span> pares
                  <span className="block text-xs opacity-75">{i.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </ReportSection>

      {/* ---------------- 4. Registro completo ---------------- */}
      <ReportSection id="registro" eyebrow="Sección 4" title="Registro de la revisión, par por par"
        description={`${reviewed.length} pares en la selección actual. Cada uno declara su estado, su motivo tipificado y la evidencia que lo sostiene.`}>
        <div className="flex flex-wrap gap-2 mb-4">
          <button type="button" className="btn btn-secondary"
            onClick={() => download('encodat_correlaciones_revision.csv', () => reviewCSV(reviewed))}>
            Descargar el registro de la selección
          </button>
          <button type="button" className="btn btn-secondary"
            onClick={() => download('encodat_correlaciones_exclusiones.csv', () => reviewCSV(exclusions()))}>
            Descargar solo las exclusiones
          </button>
          <button type="button" className="btn btn-secondary"
            onClick={() => download('encodat_correlaciones_pendientes.csv', () => reviewCSV(pendingPairs()))}>
            Descargar las definiciones pendientes
          </button>
        </div>
        {reviewed.length === 0
          ? <Availability state="no-disponible" title="Ningún par en esta selección" reason="Cambia el estado, el indicador o la búsqueda." />
          : (
            <>
              <div className="space-y-2">
                {reviewed.slice((page - 1) * 20, page * 20).map((r) => <ReviewRow key={r.pair_id} r={r} />)}
              </div>
              {pages > 1 && (
                <nav className="flex items-center gap-2 mt-4" aria-label="Paginación del registro">
                  <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => changePage(page - 1)}>Anterior</button>
                  <span className="text-sm tnum">Página {page} de {pages}</span>
                  <button type="button" className="btn btn-secondary" disabled={page >= pages} onClick={() => changePage(page + 1)}>Siguiente</button>
                </nav>
              )}
            </>
          )}
      </ReportSection>

      {/* ---------------- 5. Método ---------------- */}
      <ReportSection id="metodo" eyebrow="Sección 5" title="Método, evidencia y límites">
        <MethodDisclosure
          title="Cómo se calcularon y verificaron estas cifras"
          open={false}
          method={D.method}
          definition={D.domain}
          source={
            <ul className="list-disc pl-5 space-y-1">
              {D.sources.slice(0, 8).map((s) => (
                <li key={s.path} className="break-words"><code className="break-all">{s.path}</code> · sha256 {s.sha256.slice(0, 12)}…</li>
              ))}
            </ul>
          }
          precision={`Verificación independiente: ${validation?.pairs_recomputed ?? 'No disponible'} pares recalculados en numpy; error máximo en phi ${validation ? validation.max_errors.phi_abs_error.toExponential(1) : 'No disponible'}; Holm reproducido con error máximo ${validation ? validation.holm_max_abs_error.toExponential(1) : 'No disponible'}.`}
        >
          <dl>
            <dt>Reglas de exclusión</dt>
            <dd>
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(D.selection_rules.reason_codes)
                  .filter(([c]) => D.selection_rules.exclusion_codes.includes(c))
                  .map(([c, t]) => <li key={c} className="break-words"><code className="break-all">{c}</code> — {t}</li>)}
              </ul>
            </dd>
            <dt>Familia de comparaciones</dt>
            <dd>
              {D.multiplicity.family} Tamaño: {D.multiplicity.family_size}. Pares con cifras: {D.multiplicity.reported_pairs}.
              {D.multiplicity.conservative_note ? ` ${D.multiplicity.conservative_note}` : ''}
            </dd>
            <dt>Condiciones positivas verificadas</dt>
            <dd>
              {validation
                ? `${validation.declared_conditions_checked} condiciones declaradas se compararon persona por persona con la derivación real de indicators.py; ${validation.declared_conditions.filter((c) => c.verified).length} coinciden exactamente.`
                : 'No disponible'}
            </dd>
            <dt>Lo que no se reprodujo aquí</dt>
            <dd className="break-words"><ul className="list-disc pl-5 space-y-1">{(validation?.not_reproduced_here ?? ['No disponible']).map((t) => <li key={t}>{t}</li>)}</ul></dd>
            <dt>Unidad de análisis</dt>
            <dd>{D.analysis_unit_note} {D.region_count_note}</dd>
            <dt>Límites declarados</dt>
            <dd><ul className="list-disc pl-5 space-y-1">{D.limitations.map((l) => <li key={l}>{l}</li>)}</ul></dd>
          </dl>
        </MethodDisclosure>
        <div className="mt-4 space-y-3">
          {D.blockers.map((b) => (
            <Availability key={b.id} state="pendiente" title={b.title} reason={`${b.detail} Fuente: ${b.source}`} className="break-words" />
          ))}
        </div>
      </ReportSection>
    </div>
  );
}
