# ENCODAT 2025 · Explorador (encodat_explorer)

Aplicación web pública, interactiva y estadísticamente rigurosa para explorar los
resultados de la **Encuesta Nacional de Consumo de Drogas, Alcohol y Tabaco (ENCODAT) 2025**.

Construida con **Next.js 14 (App Router) · TypeScript · React · Tailwind CSS**. Gráficas en
SVG a la medida (dot/forest plots con IC, cartograma, ranking) para control total y
correspondencia exacta entre gráfica y tabla.

## Arquitectura de dos capas
- **`encodat_analysis`** (carpeta hermana): genera y valida las estimaciones desde el microdato
  (motor de encuesta compleja en numpy puro). Produce `output/estimates.json`, `indicators.json`,
  `regions.json` y `data_validation_report.md`.
- **`encodat_explorer`** (esta app): **solo muestra** tablas de estimaciones ya calculadas.
  No recalcula prevalencias desde el microdato. La fuente de verdad es `data/*.json`.

## Correr localmente
```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm run start   # producción
```
Requiere Node ≥ 18 (probado con Node 22).

## Estructura
```
app/            rutas: / (Inicio), /explorar, /datos, /metodologia
components/     RangePlot, RegionCartogram, NationalHero, DataTable, ExploreView, ...
lib/            types.ts, data.ts (consultas + CSV), scale.ts, narrative.ts, format.ts
data/           estimates.json, indicators.json, regions.json  (copiados de encodat_analysis/output)
docs/           DESPLIEGUE.md, ACTUALIZAR_DATOS.md, AGREGAR_INDICADORES.md
```

## Modelo de datos (tabla normalizada, formato largo)
`year, indicator_id, geo_level, region_id, region_name, sex, age_group, estimate, ci_low,
ci_high, se, cv, n, n_pos, deff, df, pop`. Cada fila es una observación única. La gráfica, el
tooltip, la tabla y el CSV usan **la misma** fila: sin copias independientes.

## Alcance de v1
- Un indicador de extremo a extremo: **consumo de alcohol alguna vez** (`al1`).
- Niveles: **nacional y 9 regiones** (dominio de representatividad del diseño) × sexo × 3 grupos de edad.
- Reproduce el Resumen Ejecutivo oficial al decimal; IC 95% por linealización de Taylor.
- **Entidades (32 estados)**: diferido a v2 (la encuesta no es representativa a nivel estatal;
  el Resumen Ejecutivo no publica cifras estatales). Sinaloa no se contempla en la encuesta.
- **2016**: el modelo ya incluye `year`; sin microdato 2016 no se construyen comparaciones aún.

## Verificación / trazabilidad
`node -e '...'` sobre `data/estimates.json` confirma: 90 celdas, nacional vs PDF Δmáx 0.043 pp,
0 violaciones de integridad, 0 duplicados. Ver `AUDIT_REPORT.md`.
