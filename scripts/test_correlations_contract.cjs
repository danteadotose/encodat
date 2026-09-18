/**
 * Contrato del módulo de correlaciones.
 *
 * Comprueba lo que la entrega promete:
 *  - el registro cubre todo el universo de pares y sus estados suman;
 *  - toda exclusión lleva motivo tipificado y evidencia, y ninguna se apoya en
 *    phi, en el cociente de momios ni en un valor p;
 *  - las asociaciones legítimas SE CONSERVAN (los tres pares de conducta
 *    suicida, que son los de mayor phi, siguen dentro con cifras);
 *  - matrices, rankings y exportaciones rechazan pares excluidos, pendientes o
 *    sin liberación de resultados;
 *  - toda N ponderada mostrada declara su universo;
 *  - la familia de multiplicidad no se reduce a posteriori.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const data = require('../data/correlations_reviewed.json');
const source = fs.readFileSync(path.join(root, 'lib/correlations.ts'), 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText;
const context = {
  exports: {},
  require: (id) => {
    if (id === '@/data/correlations_reviewed.json') return data;
    if (id === './types') return {};
    throw new Error(`import inesperado: ${id}`);
  },
};
vm.runInNewContext(js, context);
const api = context.exports;

/* ---------- 1. universo y estados ---------- */
const review = new Map(data.review.map((r) => [r.pair_id, r]));
assert.equal(review.size, data.counts.candidate_universe, 'el registro debe cubrir todo el universo');
const n = data.indicators.length;
assert.equal(review.size, (n * (n - 1)) / 2, 'el universo debe ser todas las parejas de indicadores');
const byStatus = (s) => data.review.filter((r) => r.status === s).length;
assert.equal(byStatus('excluded'), data.counts.excluded_total);
assert.equal(byStatus('definition_pending'), data.counts.definitions_pending_total);
assert.equal(byStatus('candidate'), data.counts.candidates_total);
assert.equal(byStatus('excluded') + byStatus('definition_pending') + byStatus('candidate'), review.size);

/* ---------- 2. toda exclusión con motivo tipificado y evidencia ---------- */
const forbidden = /\bphi\b|odds[_ ]?ratio|momios|valor\s*p\b|p[_-]?value|p\s*<|umbral de correlaci|coeficiente de correlaci/i;
for (const r of data.review.filter((x) => x.status === 'excluded')) {
  assert.ok(data.selection_rules.exclusion_codes.includes(r.reason_code),
    `motivo de exclusión no tipificado: ${r.reason_code}`);
  assert.ok(r.reason_family && r.reason, `exclusión sin motivo redactado: ${r.pair_id}`);
  assert.ok(Array.isArray(r.evidence) && r.evidence.length >= 2,
    `exclusión sin evidencia suficiente: ${r.pair_id}`);
  for (const e of r.evidence) assert.ok(e.tipo, 'toda evidencia declara su tipo');
  assert.ok(!forbidden.test(`${r.reason} ${r.reason_family}`),
    `la exclusión de ${r.pair_id} invoca una medida de asociación: "${r.reason}"`);
  assert.equal(r.analytical_status, 'excluded_from_analysis');
}
for (const r of data.review.filter((x) => x.status === 'definition_pending')) {
  assert.ok(data.selection_rules.pending_codes.includes(r.reason_code));
  assert.ok(r.evidence.some((e) => e.tipo !== 'grafo_de_variables_derivadas'),
    `pendiente sin evidencia específica: ${r.pair_id}`);
}
/* cada exclusión se apoya en al menos una evidencia de construcción demostrable */
const proofTypes = new Set(['implicacion_logica', 'salto_comun_verificado', 'salto_del_cuestionario_verificado']);
for (const r of data.review.filter((x) => x.status === 'excluded')) {
  assert.ok(r.evidence.some((e) => proofTypes.has(e.tipo) || e.tipo === 'grafo_de_variables_derivadas'),
    `exclusión sin prueba de construcción: ${r.pair_id}`);
}

/* ---------- 3. se CONSERVAN las asociaciones legítimas ---------- */
const keep = ['ideacion_suicida|intento_suicida', 'ideacion_suicida|plan_suicida', 'intento_suicida|plan_suicida'];
for (const id of keep) {
  const r = review.get(id);
  assert.ok(r, `falta el par ${id}`);
  assert.equal(r.status, 'candidate', `${id} debe conservarse: son preguntas separadas`);
  const result = data.pairs.find((p) => p.pair_id === id);
  assert.ok(result && result.analytical_status === 'available_recomputed_and_verified',
    `${id} debe publicar cifras`);
  assert.ok(result.phi > 0.4, `${id} es una asociación alta y debe seguir dentro`);
}
/* el par de mayor phi del módulo no está excluido: una asociación alta no se elimina */
const strongest = [...data.pairs].filter((p) => p.phi != null).sort((a, b) => Math.abs(b.phi) - Math.abs(a.phi))[0];
assert.equal(review.get(strongest.pair_id).status, 'candidate');

/* ---------- 4. la puerta filtra matrices, rankings y exportaciones ---------- */
const reportable = api.reportablePairs();
assert.equal(reportable.length, data.counts.validated_results);
for (const p of reportable) {
  assert.equal(review.get(p.pair_id).status, 'candidate');
  assert.ok(p.release_gate_blocked_indicators.length === 0);
  assert.ok(p.weighted_joint_n > 0 && p.weighted_denominator_n >= p.weighted_joint_n);
  assert.ok(Math.abs(p.phi) <= 1 && p.phi_ci_low <= p.phi && p.phi <= p.phi_ci_high);
  assert.ok(p.odds_ratio > 0, 'ningún cociente de momios negativo');
  assert.ok(p.p_holm >= p.p_raw - 1e-14 && p.p_holm <= 1);
}
const withheld = api.withheldPairs();
assert.equal(withheld.length, data.counts.withheld_release_gate_results);
for (const p of withheld) {
  assert.equal(p.phi, null, 'un par sin liberación no publica cifras');
  assert.equal(p.p_holm, null);
  assert.ok(p.release_gate_reason, 'un par retenido declara su motivo');
}
const csv = api.analyticalCSV(reportable);
assert.equal(csv.split('\n').length, reportable.length + 1);
const columns = csv.split('\n')[0].split(',');
for (const c of ['n', 'n11', 'sample_n', 'n_pos', 'phi_se']) assert.ok(!columns.includes(c), `columna interna filtrada: ${c}`);
assert.ok(columns.includes('weighted_n_meaning') && columns.includes('weighted_denominator_meaning'),
  'toda N ponderada exportada declara su universo');
for (const bad of ['excluded', 'definition_pending']) {
  const victim = data.review.find((r) => r.status === bad);
  assert.throws(() => api.analyticalCSV([{ ...reportable[0], pair_id: victim.pair_id }]),
    `la exportación debe rechazar un par ${bad}`);
}
assert.throws(() => api.analyticalCSV([{ ...reportable[0], pair_id: withheld[0].pair_id }]),
  'la exportación debe rechazar un par sin liberación');

/* ---------- 5. registro descargable ---------- */
const registry = api.reviewCSV(api.exclusions());
assert.equal(registry.split('\n').length, data.counts.excluded_total + 1);
assert.ok(registry.split('\n')[0].includes('motivo_tipificado'));
assert.ok(registry.split('\n')[0].includes('evidencia'));
assert.equal(api.exclusionsByReason().reduce((s, x) => s + x.count, 0), data.counts.excluded_total);
assert.equal(api.pendingByReason().reduce((s, x) => s + x.count, 0), data.counts.definitions_pending_total);

/* ---------- 6. filtros coherentes entre gráfica, tabla y descarga ---------- */
for (const r of reportable) {
  const selected = reportable.filter((p) => api.matchesPair(p, r.a, ''));
  assert.ok(selected.some((p) => p.pair_id === r.pair_id));
  assert.ok(api.analyticalCSV(selected).includes(r.pair_id));
}

/* ---------- 7. multiplicidad y unidad de análisis ---------- */
assert.equal(data.multiplicity.status, 'applied');
assert.equal(data.multiplicity.family_size, data.counts.computed_pairs,
  'la familia no se reduce a posteriori: sigue siendo la predeclarada');
assert.ok(data.multiplicity.family_size > data.multiplicity.reported_pairs);
assert.ok(data.multiplicity.recomputation_error < 1e-12, 'Holm reproducido desde los p crudos');
assert.equal(data.analysis_unit, 'individual');
assert.equal(data.region_count, null);
assert.ok(/persona/i.test(data.analysis_unit_note));
assert.ok(data.design.observations > 0 && data.design.strata > 0 && data.design.psus > 0);
assert.ok(data.design.observations !== Math.round(reportable[0].weighted_denominator_n),
  'las observaciones del método no son una N ponderada');

/* ---------- 8. verificación independiente ---------- */
const v = data.calculation_validation;
assert.equal(v.status, 'PASS');
assert.equal(v.declared_conditions.filter((c) => c.verified).length, v.declared_conditions_checked);
assert.ok(v.max_errors.phi_abs_error < 1e-10 && v.max_errors.phi_se_abs_error < 1e-8);
assert.ok(v.not_reproduced_here.length > 0, 'se declara lo que no se reprodujo');

/* ---------- 9. la regla de conteos ponderados se declara no aplicable ---------- */
const na = data.selection_rules.not_applicable.find((x) => x.rule === 'conteos_ponderados_por_tamano_poblacional');
assert.ok(na && na.status === 'no_aplica' && na.reason.length > 60);

console.log(
  `Correlations contract OK — universo ${review.size} pares: ${data.counts.excluded_total} excluidos con evidencia, `
  + `${data.counts.definitions_pending_total} pendientes nombrados, ${data.counts.candidates_total} conservados; `
  + `${reportable.length} con cifras verificadas y ${withheld.length} retenidos por la puerta de liberación; `
  + `familia Holm ${data.multiplicity.family_size} sin reducir; asociaciones altas legítimas conservadas.`,
);
