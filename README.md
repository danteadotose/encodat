# ENCODAT · Informe interactivo de resultados

Informe interactivo de la Encuesta Nacional de Consumo de Drogas, Alcohol y Tabaco.
Next.js 14, React 18, TypeScript y Tailwind; las gráficas son SVG escrito a mano, sin
librerías de visualización. El sitio **solo muestra resultados precalculados y
revisados**: no recalcula estimaciones desde el microdato, que no se distribuye aquí.

## Estado real de los datos

La distancia entre el catálogo y las cifras publicables es deliberada y visible en la
interfaz, no una nota al pie.

- **68 indicadores** en el catálogo; **7 con resultados publicables**, que suman 627
  celdas en `data/estimates_reviewed.json`: alcohol alguna vez, malestar psicológico
  (K10), ideación, plan e intento suicida, cualquier violencia recibida y tratamiento
  profesional de salud mental. Los 61 restantes aparecen con su estado de
  disponibilidad y el motivo, nunca con una cifra.
- **111 N ponderadas de categoría** transcritas y verificadas del informe oficial; las
  516 restantes muestran «No disponible». Ninguna N faltante se sustituye por el
  tamaño de muestra ni se deduce dividiendo N entre un porcentaje redondeado.
- Toda N de población mostrada es **ponderada** y declara si corresponde a la
  **categoría** o al **universo analítico**. El componente que las imprime exige esa
  etiqueta por tipo: no compila sin ella.
- Los análisis territoriales son por **región** (9 regiones). Las entidades solo
  construyen las geometrías. Sinaloa no está contemplado en el levantamiento de 2025 y
  se representa como «no incluido en la encuesta», nunca imputado.

## Definiciones y procedencia

Los indicadores del dominio de drogas se derivan con los **nombres oficiales** de la
sintaxis SPSS de derivación de la ENCODAT (`_av`, `_ua`, `_um`, `_ini`). Cada una de
las 89 variables derivadas declara su etiqueta oficial, sus variables de origen y su
procedencia: **43 son sentencia literal de la sintaxis oficial y 46 son reconstrucción
del proyecto**, porque los bloques correspondientes de la sintaxis no están
disponibles. La interfaz distingue ambos casos con texto, no solo con color.

Cada indicador se contrasta con el informe oficial y muestra su resultado: coincide,
aproximado, difiere o sin referencia. Las diferencias tienen causa documentada y **no
se ajusta ninguna cifra** para que coincida.

## Módulos

**Correlaciones.** Co-ocurrencia individual entre indicadores binarios, con razón de
momios y phi ponderados por diseño y ajuste de Holm sobre una familia predeclarada. Del
universo de 820 pares, 81 se excluyen por dependencia de construcción demostrada
—grafo de derivación, sentencias de la sintaxis y saltos del cuestionario verificados
contra el microdato—, 36 quedan pendientes de definición y 703 se conservan. **La
exclusión nunca se decide por un umbral de correlación**: las asociaciones altas
legítimas se conservan. La unidad de análisis es la persona.

**Comparación de ediciones 2016–2017 y 2025.** Matriz de comparabilidad de los 68
indicadores y comparaciones habilitadas solo donde la evidencia las sustenta. Los
contrastes distinguen «cambio con evidencia estadística», «sin evidencia suficiente de
cambio» y «comparación no evaluable»; un resultado no significativo nunca se llama
igualdad, y la significancia no se deduce del solapamiento de intervalos.

## Ejecutar

```sh
npm install
npm run dev        # http://localhost:3000
npm run build      # export estático en out/
```

`npm run start` no sirve un export estático: usar cualquier servidor de archivos para
`out/`. Para publicarlo bajo un subdirectorio, definir `BASE_PATH`:

```sh
BASE_PATH=/encodat npm run build
```

## Verificación

```sh
npx tsc --noEmit
node scripts/test_results_contract.cjs
node scripts/test_correlations_contract.cjs
node scripts/test_temporal.cjs
```

Los contratos comprueban que la gráfica, la tabla y la descarga salgan del mismo
conjunto de datos, que las N ponderadas lleven siempre su etiqueta, que no se publique
ningún tamaño de muestra y que las celdas no autorizadas no lleguen a la interfaz.

## Fuentes y contratos de datos

- `data/estimates_reviewed.json`: únicamente las celdas autorizadas por
  `data/release_manifest.json`.
- `data/correlations_reviewed.json`: salida revisada del módulo de correlaciones.
- `data/temporal.json`: resultados de la comparación entre ediciones.
- `docs/REPORT_COMPONENTS.md`: sistema visual compartido, con la firma de cada
  componente.
- `docs/DESIGN_SYSTEM.md`, `docs/CORRELATIONS_REVIEW.md`, `docs/ACTUALIZAR_DATOS.md`:
  diseño, revisión de correlaciones y procedimiento de actualización.

La capa de análisis que genera y valida estas tablas vive fuera de este repositorio.
