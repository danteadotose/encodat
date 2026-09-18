// Read-only checks against the actual TypeScript data layer. No site files edited.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const site = path.resolve(__dirname, '..');
const ts = require(path.join(site, 'node_modules/typescript'));
const js = ts.transpileModule(fs.readFileSync(path.join(site, 'lib/data.ts'), 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020},
}).outputText;
const sandbox = {exports: {}, require: id => {
  assert(id.startsWith('@/data/') && id.endsWith('.json'), `Unexpected runtime dependency ${id}`);
  return JSON.parse(fs.readFileSync(path.join(site, id.slice(2)), 'utf8'));
}};
vm.runInNewContext(js, sandbox);
const api = sandbox.exports;
const audit = JSON.parse(fs.readFileSync(path.join(site, 'public/validation/disponibilidad.json'), 'utf8'));
const original = JSON.parse(fs.readFileSync(path.join(site, 'data/estimates.json'), 'utf8')).records;
const key = r => ['indicator_id','geo_level','region_id','sex','age_group'].map(k => r[k]).join('|');
const source = new Map(original.map(r => [key(r), r]));
const allowed = new Map(audit.allowed_cells.map(r => [r.key, r]));
assert.strictEqual(api.RECORDS.length, allowed.size);
assert.strictEqual(new Set(api.RECORDS.map(key)).size, allowed.size);
let unchanged = 0;
for (const r of api.RECORDS) {
  assert(allowed.has(key(r)));
  assert(!('n' in r) && !('n_pos' in r));
  for (const f of ['estimate','ci_low','ci_high','se','cv','reliab','pop']) {
    assert.strictEqual(r[f], source.get(key(r))[f]); unchanged++;
  }
  assert.strictEqual(r.weighted_n, allowed.get(key(r)).weighted_n);
}
for (const r of audit.blocked_cells) {
  assert.strictEqual(api.query(r).length, 0);
}
let nationalQueries = 0, regionQueries = 0;
const indicators = [...new Set(api.RECORDS.map(r => r.indicator_id))];
for (const indicator_id of indicators) for (const sex of ['total','hombres','mujeres']) for (const age_group of ['12-65','12-17','18-65']) {
  const n = api.national(indicator_id, sex, age_group);
  assert.strictEqual(n.geo_level, 'nacional'); assert.strictEqual(n.region_id, 0); nationalQueries++;
  const nKey = key(n), nPop = n.pop;
  for (let region_id = 1; region_id <= 9; region_id++) {
    const regional = api.query({indicator_id,sex,age_group,geo_level:'region',region_id});
    assert(regional.every(r => r.region_id === region_id && r.geo_level === 'region'));
    assert.strictEqual(key(api.national(indicator_id,sex,age_group)), nKey);
    assert.strictEqual(api.national(indicator_id,sex,age_group).pop, nPop); regionQueries++;
  }
}
function splitCSV(line) {
  const cells = []; let field = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && quoted && line[i+1] === '"') { field += '"'; i++; }
    else if (c === '"') quoted = !quoted;
    else if (c === ',' && !quoted) { cells.push(field); field = ''; }
    else field += c;
  }
  cells.push(field); return cells;
}
const [header, ...body] = api.toCSV(api.RECORDS).split('\n').map(splitCSV);
assert(!header.includes('n') && !header.includes('n_pos') && !header.includes('pop'));
let csvFields = 0;
for (let i = 0; i < body.length; i++) {
  const r = api.RECORDS[i];
  assert.strictEqual(body[i].length, header.length);
  header.forEach((f,j) => {
    const value = f === 'weighted_denominator_n' ? r.pop : f === 'weighted_denominator_meaning' ? 'poblacion_ponderada_del_universo_analitico' : f === 'reliab' && r.cv == null ? null : r[f];
    assert.strictEqual(body[i][j], value == null ? 'No disponible' : String(value)); csvFields++;
  });
}
const result = {rows_checked: api.RECORDS.length, unchanged_source_fields: unchanged,
  weighted_category_n_available: api.RECORDS.filter(r=>r.weighted_n != null).length,
  blocked_cells_absent: audit.blocked_cells.length, national_queries_checked: nationalQueries,
  regional_queries_checked: regionQueries, csv_rows_checked: body.length, csv_fields_checked: csvFields,
  limits: 'Data-layer contract check; browser interaction verification is performed separately by the coordinator.'};

console.log(JSON.stringify(result, null, 2));
