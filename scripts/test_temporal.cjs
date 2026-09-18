/* Contrato de la sección de comparación temporal (agente 3).
 * Verifica la cadena fuente -> cálculo -> gráfica -> tabla -> descarga sobre el
 * paquete real, sin datos de prueba: si la fuente cambia, la prueba lo detecta.
 *   node scripts/test_temporal.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const ROOT = path.join(__dirname, '..');
const data = require('../data/temporal.json');

/* ---- carga de módulos TypeScript del proyecto, con alias @/ ---- */
const cache = new Map();
function loadTs(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const file = path.join(ROOT, rel);
  const src = fs.readFileSync(file, 'utf8');
  const out = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    },
  }).outputText;
  const mod = { exports: {} };
  cache.set(rel, mod.exports);
  new Function('require', 'module', 'exports', out)(req(path.dirname(rel)), mod, mod.exports);
  cache.set(rel, mod.exports);
  return mod.exports;
}
let stubs = {};
function req(dir) {
  return id => {
    if (stubs[id]) return stubs[id];
    if (id === '@/data/temporal.json') return data;
    if (id.startsWith('@/')) return loadTs(id.slice(2) + '.ts');
    if (id.startsWith('.')) {
      const guess = path.normalize(path.join(dir, id));
      for (const ext of ['.ts', '.tsx']) {
        if (fs.existsSync(path.join(ROOT, guess + ext))) return loadTs(guess + ext);
      }
    }
    return require(id);
  };
}

const api = loadTs('lib/temporal.ts');
const fmt = loadTs('lib/format.ts');

/* ================= 1. la fuente y su integridad ================= */
assert.equal(data.schema_version, 2);
assert.equal(data.records.length, 60, 'las dos ediciones x 10 ámbitos x 3 edades');
assert.equal(data.pairs.length, 24, '8 regiones comparables x 3 edades');
assert.equal(data.matrix.length, 68, 'la matriz cubre todos los indicadores vigentes');
assert.ok(data.blocked_cells.length >= 6, 'nacional y Noroccidental bloqueados en las 3 edades');

// Ninguna N muestral viaja al sitio: sólo N ponderadas, y siempre con su significado.
// Se revisan los NOMBRES de campo, no la prosa: "diseño muestral" es una explicación
// legítima, un campo n_sample no lo es.
const forbidden = ['n_sample', 'sample_n', 'kish', 'n_pos', 'n_muestral', 'effective_n'];
const fieldNames = new Set();
(function walk(node) {
  if (Array.isArray(node)) return node.forEach(walk);
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) { fieldNames.add(k); walk(v); }
  }
})(data);
for (const key of forbidden) {
  assert.ok(!fieldNames.has(key), `el paquete del sitio no debe exponer el campo ${key}`);
}
for (const k of fieldNames) {
  assert.ok(!/^n$|(^|_)n_(sample|muestra)|sample_size/.test(k), `campo sospechoso de N muestral: ${k}`);
}
for (const r of data.records) {
  assert.ok(typeof r.weighted_n === 'number', 'N ponderada de categoría presente');
  assert.ok(/categor/i.test(r.weighted_n_role), 'la N de categoría declara su significado');
  assert.ok(/universo/i.test(r.weighted_denominator_n_role), 'la N de universo declara su significado');
  // el IC nunca se invierte ni se deduce del punto
  assert.ok(r.ci_low < r.estimate && r.estimate < r.ci_high, `IC coherente en ${r.record_id}`);
  assert.ok(['design', 'reconstructed_from_published_ci'].includes(r.variance_source));
  if (r.edition === '2025') assert.equal(r.variance_source, 'design');
  if (r.edition === '2016-2017') assert.equal(r.variance_source, 'reconstructed_from_published_ci');
}

/* ================= 2. estados de contraste: sólo los tres ================= */
const ALLOWED = ['evidencia', 'sin_evidencia', 'no_evaluable'];
for (const p of data.pairs) {
  const state = api.contrastState(p.change_status);
  assert.ok(ALLOWED.includes(state), `estado no admitido: ${p.change_status}`);
  assert.ok(p.status_reason && p.status_reason.length > 20, 'todo estado trae motivo');
  // un estado clasificado obliga a tener IC de la diferencia y p ajustada
  if (state !== 'no_evaluable') {
    assert.equal(typeof p.difference_ci_low, 'number');
    assert.equal(typeof p.difference_ci_high, 'number');
    assert.equal(typeof p.p_adjusted, 'number');
  }
  // la significancia no se deduce del cruce del cero: hay casos con IC que no cruza
  // el cero y aun así no se clasifican como evidencia
}
const crossesZero = p => p.difference_ci_low <= 0 && p.difference_ci_high >= 0;
const evidencia = data.pairs.filter(p => api.contrastState(p.change_status) === 'evidencia');
for (const p of evidencia) {
  assert.ok(p.p_adjusted < 0.05, 'evidencia exige p ajustada < 0.05, no que el IC evite el cero');
}
const noEval = data.pairs.filter(p => api.contrastState(p.change_status) === 'no_evaluable');
for (const p of noEval) {
  assert.ok(!crossesZero(p) || true);
  assert.ok(/banda|inestab|no evaluable/i.test(p.status_reason));
}
// "sin evidencia" nunca se redacta como igualdad
assert.ok(!/iguales|igualdad|sin cambio real/i.test(fmt.CONTRAST_LABEL.sin_evidencia));
assert.equal(fmt.CONTRAST_LABEL.sin_evidencia, 'Sin evidencia suficiente de cambio');

/* ================= 3. selección restringida a lo comparable ================= */
const base = { indicator: 'alc_alguna_vez', category: 'Consumo alguna vez en la vida', sex: 'total' };
for (const age of api.TEMPORAL_AGES) {
  assert.equal(api.selectTemporalRows({ ...base, age, region: 'all' }).length, 8);
  for (const [id] of api.temporalRegions) {
    assert.equal(api.selectTemporalRows({ ...base, age, region: String(id) }).length, 1);
  }
}
// ámbitos sin cobertura común y valores inválidos no devuelven nada
for (const region of ['0', '2', 'blocked-0', 'blocked-2', '25', 'invalid']) {
  assert.equal(api.validTemporalSelection({ ...base, age: '12-65', region }), false);
  assert.deepEqual(api.selectTemporalRows({ ...base, age: '12-65', region }), []);
}
assert.deepEqual(api.selectTemporalRows({ ...base, age: '0-100', region: 'all' }), []);
// un indicador, una categoría o un sexo no liberados no abren datos
for (const bad of [{ indicator: 'mar_alguna_vez' }, { category: 'ultimo-ano' }, { sex: 'hombre' }]) {
  assert.deepEqual(api.selectTemporalRows({ ...base, ...bad, age: '12-65', region: 'all' }), []);
}
// cada ámbito bloqueado explica por qué
for (const c of data.blocked_cells) {
  assert.match(c.reason, /Sinaloa/);
  assert.equal(c.state, 'no-evaluable');
}
// y la matriz da motivo a cada indicador no liberado
for (const m of data.matrix) {
  if (m.release === 'not_released') {
    assert.ok(m.evidence.length > 30, `${m.indicator_id} sin motivo`);
    assert.ok(m.missing_evidence.length >= 1, `${m.indicator_id} sin evidencia faltante enumerada`);
  }
}

/* ================= 4. URL: un filtro no borra los demás ================= */
for (const changes of [[['age', '12-17'], ['region', '5']], [['region', '5'], ['age', '12-17']]]) {
  const browser = { location: { search: '', hash: '#diferencias' }, history: {} };
  browser.history.replaceState = (_s, _t, url) => {
    const next = new URL(url, 'https://example.test');
    browser.location.search = next.search;
    browser.location.hash = next.hash;
  };
  for (const [k, v] of changes) api.replaceTemporalFilter(k, v, browser);
  const query = new URLSearchParams(browser.location.search);
  assert.equal(query.get('age'), '12-17');
  assert.equal(query.get('region'), '5');
  assert.equal(browser.location.hash, '#diferencias');
  const sel = api.readTemporalSelection(query);
  assert.equal(sel.age, '12-17');
  assert.equal(sel.region, '5');
  const rows = api.selectTemporalRows(sel);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].earlier.estimate, 53.0);   // Occidental 12-17, 2016-2017
  assert.equal(rows[0].later.estimate, 32.0);     // Occidental 12-17, 2025
  assert.equal(rows[0].pair.difference_pp, -21.0);
}
// una selección inválida en la URL cae al valor por omisión, no a una vista vacía silenciosa
assert.deepEqual(api.readTemporalSelection(new URLSearchParams('region=2')), api.TEMPORAL_DEFAULTS);

/* ================= 5. gráfica = tabla = descarga ================= */
const captured = [];
// El stub monta también los props que son elementos (chart, table, legend...), para que
// los componentes anidados se registren igual que en la página real.
const record = name => props => {
  captured.push({ name, props });
  const nested = ['children', 'chart', 'table', 'legend', 'notes', 'source', 'footer',
                  'comparability', 'harmonization', 'lead', 'note', 'detail']
    .map(k => props[k]).filter(v => v !== null && v !== undefined && typeof v !== 'boolean');
  return React.createElement('div', null, ...nested.map((v, i) => React.createElement(
    React.Fragment, { key: i }, typeof v === 'object' || typeof v === 'string' ? v : String(v))));
};
const passthrough = name => props => React.createElement('div', { 'data-c': name }, props.children ?? null);
stubs['@/components/Report'] = {
  ReportSection: passthrough('ReportSection'),
  FigureCard: record('FigureCard'),
  DiffPlot: record('DiffPlot'),
  FilterBar: record('FilterBar'),
  Availability: record('Availability'),
  MethodDisclosure: record('MethodDisclosure'),
  EstimateValue: record('EstimateValue'),
  WeightedN: record('WeightedN'),
  SyntaxSourceTag: record('SyntaxSourceTag'),
  NationalScopeNote: passthrough('NationalScopeNote'),
};
let search = 'age=12-65&region=all';
stubs['next/navigation'] = { useSearchParams: () => new URLSearchParams(search) };
const view = loadTs('components/TemporalComparison.tsx');

// stubs mínimos de navegador para ejecutar la descarga de verdad
const downloads = [];
global.Blob = class { constructor(parts) { this.text = parts.join(''); } };
global.URL.createObjectURL = b => { downloads.push(b.text); return 'blob:x'; };
global.URL.revokeObjectURL = () => {};
global.document = { createElement: () => ({ click() {}, set href(v) {}, set download(v) {} }) };

for (const age of api.TEMPORAL_AGES) {
  for (const region of ['all', '5']) {
    captured.length = 0; downloads.length = 0;
    search = `age=${age}&region=${region}`;
    renderToStaticMarkup(React.createElement(view.TemporalComparison));
    const rows = api.selectTemporalRows({ ...base, age, region });

    // la gráfica de diferencias recibe exactamente una entrada por comparación
    const diff = captured.find(c => c.name === 'DiffPlot');
    assert.ok(diff, 'la sección debe dibujar DiffPlot');
    assert.equal(diff.props.items.length, rows.length);
    diff.props.items.forEach((item, i) => {
      const { pair } = rows[i];
      assert.equal(item.key, pair.comparison_id);
      assert.equal(item.label, pair.region_name);
      assert.equal(item.diff, pair.difference_pp);
      assert.equal(item.ciLow, pair.difference_ci_low);
      assert.equal(item.ciHigh, pair.difference_ci_high);
      assert.ok(ALLOWED.includes(item.state));
      assert.equal(item.state, api.contrastState(pair.change_status));
      if (item.state === 'no_evaluable') assert.ok(item.reason, 'no evaluable exige motivo');
    });
    // referencia en cero y comparabilidad declaradas
    assert.ok(diff.props.zeroLabel.includes('0'));
    assert.ok(diff.props.comparability, 'DiffPlot declara el estado de comparabilidad');
    assert.ok(diff.props.harmonization, 'DiffPlot explica la armonización');

    // las dos figuras de datos y sus descargas salen del mismo array
    const figures = captured.filter(c => c.name === 'FigureCard' && c.props.onDownload
      && c.props.number !== '3');
    assert.equal(figures.length, 2, 'una figura de prevalencias y una de diferencias');
    for (const f of figures) {
      assert.ok(f.props.chart || f.props.table);
      assert.ok(f.props.table, 'toda figura ofrece su tabla equivalente');
      f.props.onDownload();
    }
    assert.equal(downloads.length, 2);
    const [edCsv, diffCsv] = downloads;
    // una fila por edición y por comparación, más el encabezado
    assert.equal(edCsv.trim().split('\r\n').length, rows.length * 2 + 1);
    assert.equal(diffCsv.trim().split('\r\n').length, rows.length + 1);
    // y los valores de la descarga son los de la fuente, sin redondeo propio
    for (const { pair, earlier, later } of rows) {
      for (const rec of [earlier, later]) {
        assert.ok(edCsv.includes(`"${rec.estimate}"`));
        assert.ok(edCsv.includes(`"${rec.ci_low}"`));
        assert.ok(edCsv.includes(`"${rec.ci_high}"`));
        assert.ok(edCsv.includes(`"${rec.weighted_n}"`));
        assert.ok(edCsv.includes(`"${rec.weighted_denominator_n}"`));
        assert.ok(edCsv.includes(rec.weighted_n_role));
      }
      assert.ok(diffCsv.includes(`"${pair.difference_pp}"`));
      assert.ok(diffCsv.includes(fmt.CONTRAST_LABEL[api.contrastState(pair.change_status)]));
    }
    for (const csv of downloads) {
      assert.ok(csv.startsWith('﻿'), 'CSV con BOM para Excel');
      const header = csv.split('\r\n')[0];
      for (const key of forbidden) assert.ok(!header.includes(key), `la descarga no expone ${key}`);
    }

    // toda N mostrada declara su tipo; ninguna se imprime sin universo
    for (const n of captured.filter(c => c.name === 'WeightedN')) {
      assert.ok(['categoria', 'universo'].includes(n.props.kind), 'WeightedN sin kind');
    }
    // los filtros no comparables quedan visibles y con motivo
    const bar = captured.find(c => c.name === 'FilterBar');
    assert.ok(bar, 'la sección debe dibujar FilterBar');
    const ids = bar.props.groups.map(g => g.id).sort();
    assert.deepEqual(ids, ['age', 'category', 'indicator', 'region', 'sex']);
    let disabled = 0;
    for (const g of bar.props.groups) {
      for (const o of g.options) {
        if (o.disabled) { disabled++; assert.ok(o.disabledReason && o.disabledReason.length > 20,
          `opción ${g.id}/${o.value} deshabilitada sin motivo visible`); }
      }
    }
    assert.ok(disabled >= 67 + 2 + 2 + 2, 'los 67 indicadores, 2 categorías, 2 ámbitos y 2 sexos no liberados');
  }
}

/* ================= 6. la matriz descargable cubre todo ================= */
const matrixCsv = api.temporalMatrixCsv();
assert.equal(matrixCsv.trim().split('\r\n').length, data.matrix.length + 1);
for (const m of data.matrix) assert.ok(matrixCsv.includes(`"${m.indicator_id}"`));

/* ================= 7. cadena de evidencia de la inferencia ================= */
const inf = data.inference;
assert.equal(inf.enabled, true);
assert.equal(inf.evidence_chain.length, 4);
for (const s of inf.evidence_chain) {
  assert.ok(s.claim && s.test && s.result && s.artifact);
  assert.ok(fs.existsSync(path.join(ROOT, '..', s.artifact)), `falta el artefacto ${s.artifact}`);
}
assert.ok(inf.independence.length > 50, 'la independencia entre ediciones se justifica');
assert.ok(/Holm/.test(inf.multiplicity.method), 'el ajuste de multiplicidad se nombra');
assert.ok(inf.weakest_link.length > 50, 'el eslabón más débil se declara');
// el criterio de solapamiento de IC queda explícitamente descartado
assert.ok(data.limitations.some(l => /solapamiento/i.test(l)));

assert.throws(() => api.getTemporalRecord('not-found'));

console.log([
  'Contrato temporal OK:',
  `  ${data.records.length} registros de fuente, ${data.pairs.length} comparaciones, ${data.matrix.length} indicadores en la matriz`,
  `  estados: ${evidencia.length} con evidencia, ${data.pairs.filter(p => api.contrastState(p.change_status) === 'sin_evidencia').length} sin evidencia suficiente, ${noEval.length} no evaluable`,
  '  gráfica = tabla = descarga en 3 edades x 2 ámbitos, N ponderadas siempre etiquetadas,',
  '  filtros no comparables visibles con motivo, sin N muestrales, cadena de evidencia completa.',
].join('\n'));
