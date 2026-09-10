# AUDIT_REPORT.md — ENCODAT 2025 Explorer (v1, indicador piloto)

_Auditoría independiente (rol Agente 6). No asume que las demás capas trabajaron bien;
verifica la cadena completa de trazabilidad._

## Alcance auditado
Datos, estadística, filtros, visualización, interfaz, descargas y metodología para el
indicador piloto **alcohol alguna vez** (`al1`), nivel nacional + 9 regiones × sexo × edad.

## Método
1. Reproducción de cifras oficiales desde el microdato (capa de análisis).
2. Verificación de que el snapshot empaquetado en la app (`data/estimates.json`) es idéntico
   a la salida validada.
3. Trazado de celdas seleccionadas: fuente → tabla normalizada → gráfica → tooltip → tabla → CSV.
4. Chequeos de integridad automatizados.

## Resultados

### 1. Correspondencia con la fuente
- Todas las celdas nacionales × sexo × edad reproducen el Resumen Ejecutivo. **Δ máx = 0.043 pp**
  (redondeo del PDF a 1 decimal). Sin fallas > 0.1 pp.
- SE por linealización de Taylor concuerdan con bootstrap Rao–Wu (~5%).

### 2. Snapshot de la app
- `data/estimates.json`: 90 registros, **0 duplicados**, **0 violaciones** de `ci_low ≤ estimate ≤ ci_high`
  ni de rango [0,100]. Idéntico a la salida de `encodat_analysis`.

### 3. Trazabilidad (celda de ejemplo, elegida al azar)
`alc_alguna_vez · nacional · hombres · 12–17`:
- Microdato: media ponderada de `al1==1` con `ponde_f`, dominio 12–17 & `ds2==1`.
- Tabla normalizada / `estimates.json`: **estimate 36.5673**, IC 33.1302–40.1469, n 1927, CV 4.89.
- App (hero y panel “sexo por edad”): muestra **36.6** e IC **33.1–40.1**, n **1,927**, CV **4.9%**.
- CSV descargado con el filtro Hombres·12–17: fila con estimate 36.5673 (mismos valores, sin redondear).
- Resumen Ejecutivo oficial: **36.6**. ✅ Coinciden todas las etapas.

### 4. Comprobaciones específicas del rol auditor
- ✅ Ninguna prevalencia se recalcula en el cliente; la app solo lee `data/*.json`.
- ✅ `n` (muestra no ponderada) no se confunde con población ponderada (`pop`): son campos distintos y así se etiquetan.
- ✅ Los IC corresponden a su propia estimación (mismo registro para punto, IC, tooltip y CSV).
- ✅ Los filtros no mezclan universos: cada celda es una observación única por (indicador, geo, región, sexo, edad).
- ✅ Regiones con identificadores consistentes 1–9; Sinaloa (25) marcado “no incluido”, sin cero ni imputación.
- ✅ Valores faltantes no aparecen como cero.

## Hallazgos clasificados
- **Críticos:** ninguno.
- **Importantes:** ninguno en el alcance de v1.
- **Menores / notas:**
  - El mapa es un **cartograma esquemático** (no contorno geográfico exacto), por restricción técnica
    de acceso al geojson municipal; claramente etiquetado. Reemplazable sin tocar los datos.
  - Estimaciones regionales por sexo y edad con muestras pequeñas presentan CV altos e IC amplios;
    se muestran de forma transparente (sin umbral inventado).

## Veredicto
**APROBADO para v1** (sin errores críticos). La condición de finalización —una estimación
rastreable sin ambigüedad y con el mismo valor en todas las etapas— se cumple para el indicador piloto.
