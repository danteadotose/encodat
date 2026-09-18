# Auditoría de fuentes 2025 para la interfaz

Fecha: 15 de septiembre de 2026. Alcance: lectura de los originales de `ResultadosEncodat`; escritura exclusiva de productos de auditoría en esta carpeta. No se modificaron métodos, microdatos, resultados originales ni archivos del sitio.

## Resultado utilizable

El manifiesto `release_manifest.proposed.json` habilita **627 celdas de siete indicadores** del snapshot existente. Se reprodujeron 630 celdas; tres quedan fuera porque contienen un intervalo 0–0 degenerado y CV no disponible. La selección permite entregar resultados regionales sustentados sin confundir una auditoría pendiente con una prueba de incorrección.

| Indicador | Celdas reproducidas | Celdas contrastadas con N de categoría, prevalencia e IC publicados | Habilitadas |
|---|---:|---:|---:|
| Alcohol alguna vez | 90 | 36 | 90 |
| Malestar psicológico K10 | 90 | 18 | 90 |
| Ideación suicida | 90 | 9 | 90 |
| Plan suicida | 90 | 9 | 89 |
| Intento suicida | 90 | 9 | 88 |
| Cualquier violencia recibida | 90 | 18 | 90 |
| Tratamiento profesional de salud mental | 90 | 12 | 90 |
| **Total** | **630** | **111** | **627** |

Los 333 campos de prevalencia y límites de IC de estas 111 celdas coinciden exactamente al redondeo de una cifra decimal del informe. Sus 111 N de categoría se extrajeron literalmente del PDF y se contrastaron contra la suma directa de ponderadores positivos: diferencia inferior a una persona, compatible con la precisión impresa. No se reconstruyó ninguna N a partir de porcentajes redondeados.

Para los dominios adicionales, la evidencia es la definición operacional confirmada, ausencia de códigos ambiguos o faltantes en las variables de estos siete indicadores y reproducción exacta del motor existente. Se distinguen de las celdas cotejadas directamente con una tabla publicada; el manifiesto **no afirma que todas las celdas se publicaron en el informe**.

## Estado real y documentación antigua

- La aplicación consume 5,310 registros y 59 indicadores. `estimates.json`, `indicators.json` y `regions.json` son idénticos byte a byte entre app y `encodat_analysis/output`.
- No hay duplicados, violaciones de orden de IC, proporciones fuera de rango ni denominadores ponderados no positivos en el snapshot completo. Estos chequeos de integridad no certifican por sí solos la definición epidemiológica de los 59 indicadores.
- `AUDIT_REPORT.md` sigue describiendo el piloto de 90 registros; `data_validation_report.md` describe 1,080 registros y 12 indicadores. Sus afirmaciones no pueden generalizarse automáticamente a los 5,310 registros actuales.
- El script `validate.py` importa `PDF_TARGETS`, símbolo que ya no existe en `indicators.py`. También escribiría sobre el informe previo. No es una entrada de validación vigente y no se ejecutó.
- El estado actual del catálogo es: 35 “coincide”, 10 “aproximado”, 12 “difiere”, 2 “sin referencia”. “Coincide” admite diferencias de hasta 0.15 puntos porcentuales o 0.3 años; por ello no equivale a reproducir el decimal publicado. Además, el estado se asigna a partir del total nacional, no de cada estrato y región.

## Semántica exacta de N

`pop` proviene de `survey.py`:

- En proporciones: `sum(ponde_f)` en **base del indicador ∩ edad ∩ sexo ∩ geografía**. Es el **denominador ponderado del universo analítico**.
- En medias: la misma suma, restringida además a quienes tienen respuesta finita para la variable continua. Es el universo efectivo de la media, no toda la población de esa edad ni una cantidad de consumidores estimada por prevalencia.
- `n` y `n_pos` son conteos muestrales sin ponderar. No deben mostrarse ni exportarse como N de población. La cantidad de observaciones usada por un método debe identificarse aparte cuando sea necesaria, nunca sustituirse por población expandida.
- El snapshot original **no contiene N ponderada de casos de la categoría**. Las 111 N adicionales del manifiesto proceden de tablas del informe. Para las demás celdas: “No disponible”; no multiplicar `pop × estimate` en el frontend ni llenar con `n_pos`.

Ejemplo nacional, alcohol alguna vez, total 12–65:

- `pop = 92,590,179.5`: universo analítico ponderado.
- N publicada de quienes consumieron alcohol alguna vez = **68,265,422** (cuadro 2.1, p. 48).
- Prevalencia del snapshot = 73.7286%; IC95 = 72.7415–74.6924%. Tabla publicada: 73.7%, IC95 72.7–74.7.

## Geografía y referencia nacional

La nota del cuadro A.1 del informe completo, p. 24, confirma las nueve regiones y su composición. El catálogo original identifica los códigos 1–9; la correspondencia entidad → región observada en microdatos es única y coincide exactamente con `regions.json`. Se verificó que Sinaloa no está presente.

| Código | Nombre en la aplicación | Entidades que construyen la región |
|---:|---|---|
| 1 | Península | Baja California, Baja California Sur, Sonora |
| 2 | Nor-Occidental | Chihuahua, Durango |
| 3 | Nor-central | Coahuila, Nuevo León |
| 4 | Nor-Oriental | San Luis Potosí, Tamaulipas |
| 5 | Occidental | Aguascalientes, Colima, Jalisco, Nayarit, Zacatecas |
| 6 | Ciudad de México | Ciudad de México |
| 7 | Centro | Guanajuato, Hidalgo, México, Morelos, Puebla, Querétaro, Tlaxcala |
| 8 | Centro-Sur | Guerrero, Michoacán, Oaxaca, Veracruz |
| 9 | Sur | Campeche, Chiapas, Quintana Roo, Tabasco, Yucatán |

Las entidades solo definen geometrías y composición. No existe ninguna autorización en este manifiesto para presentar estimaciones estatales.

La referencia nacional debe consultarse con `geo_level=nacional`, `region_id=0`, conservando indicador, sexo y edad, e ignorando la selección regional. Corresponde a la cobertura nacional efectiva de ENCODAT 2025; no debe describirse como un universo que incluye Sinaloa ni recalcularse de las regiones visibles.

## Precisión

El informe completo **sí** fija criterios de CV (p. 21): 15.0–29.9% precisión moderada y ≥30.0% precisión baja. La afirmación antigua de la interfaz de que no existe un umbral es obsoleta. CV ausente debe mostrar “No disponible”, sin heredar `reliab="alta"` del generador.

Tres celdas se excluyen de resultados porque el método produce estimación cero, IC 0–0 y CV ausente:

1. `plan_suicida|region|1|hombres|12-17`
2. `intento_suicida|region|1|hombres|12-17`
3. `intento_suicida|region|8|hombres|18-65`

La interfaz debe comunicar que falta un intervalo defendible ante la ausencia de casos observados; no presentar estos resultados como prueba de ausencia del evento. Se conserva el original sin alteraciones. No se calculó significancia ni se dedujo a partir del solapamiento de IC.

## Resultados todavía no habilitados

Los otros 52 indicadores permanecen en el catálogo y en los originales. El manifiesto especifica por indicador y geografía si falta auditoría de la definición/celdas o existe una discrepancia documentada. Esta revisión acotada no declara erróneos los indicadores pendientes.

Se identificó un problema concreto en el snapshot de tabaco fumado: `base_all` incluye 36 respuestas desconocidas (`TB02`: 23 códigos 7 y 13 códigos 9) como no fumadoras. Así, hombres 12–65 muestran 22.7176% cuando el cuadro 3.5 publica 22.8%; el IC nacional total del snapshot redondea a 13.9–16.3, frente a 14.0–16.3 del informe. El estado global “coincide” no resuelve esta diferencia de denominador. Se comunicó al agente de correlaciones; esta auditoría no altera su método.

En cigarro electrónico, `TB47` contiene 6,460 blancos y nueve códigos 9. Aunque las cifras redondeadas nacionales coinciden, la revisión del salto `TB46 → TB47` es necesaria antes de interpretar todos los blancos como negativos. El agente de correlaciones revisa el cuestionario y su propio dominio por par.

## Contrato para el frontend

Archivo: `release_manifest.proposed.json`.

- `allowed_cells`: lista permitida con clave exacta `indicator_id|geo_level|region_id|sex|age_group`.
- `blocked_cells`: excepciones puntuales con la misma clave y motivo de falta de precisión.
- Cada celda permitida incluye `weighted_n` (N publicada de categoría o `null`), `weighted_n_meaning`, `source_locator`, `validation_status` y `evidence_level`.
- `evidence_level=published_point_and_ci`: cotejo directo con tabla publicada.
- `evidence_level=reproduced_domain_estimate`: reproducción del dominio con definición y motor verificados, sin afirmar que esa celda esté publicada.
- `availability`: alcance de revisión por indicador y geografía; `allowed_cells` tiene precedencia para decidir qué resultados se muestran y descargan.
- `snapshot_sha256` y `source_sha256`: huellas que atan la revisión a estos archivos exactos. Cambiar las fuentes o la salida exige volver a correr la auditoría.

Gráfica, tabla, referencia nacional y descarga deben consultar esta misma lista y los mismos filtros. La fuente de `pop` sigue siendo el registro original. La fuente de `weighted_n` es la celda del manifiesto. Las descargas de resultados deben omitir `n` y `n_pos`.

## Procedimiento y artefactos

`audit_sources.py` lee los originales y genera los CSV, el resumen y el manifiesto de esta carpeta. Verifica códigos válidos, dominios, geografía, reproducción de estimaciones/IC/SE/CV/denominador y correspondencia literal a los cuadros. La extracción de PDF conserva identificadores de página en `informe_completo.txt`. Se renderizaron y revisaron las páginas de respaldo para comprobar encabezados, columnas y notas.

- `pilot_published_reference.csv`: 36 filas fuente del piloto.
- `reviewed_published_reference.csv`: 111 filas fuente de los siete indicadores.
- `pilot_90_cells_checks.csv`: 90 celdas piloto reproducidas.
- `reviewed_domain_checks.csv`: 630 celdas reproducidas.
- `verification_summary.json`: cifras y chequeos automatizados.
- `release_manifest.proposed.json`: contrato de disponibilidad para integración.

## Fuentes primarias inspeccionadas

1. `archivos originales locales del proyecto`: metodología p. 19–21; regionalización p. 24; alcohol cuadros 2.1, 2.2, 2.5, 2.6, 2.8, 2.9 (pp. 48, 50, 53, 54, 56, 57); salud mental cuadros 4.1–4.11, 4.18 y 4.20; definiciones suplementarias pp. 128–129.
2. `archivos originales locales del proyecto`: contraste adicional de los nueve valores nacionales del piloto.
3. Microdatos y catálogo originales de `ResultadosEncodat`. `AL1`: sí=1/no=2; `ds2`: masculino=1/femenino=2; `ponde_f`: ponderador de seleccionado; `est_sel`: estrato de varianza; `mi_upm`: UPM.
4. Código actual `encodat_analysis/src/{indicators.py,survey.py,build_estimates.py}` y snapshots emparejados app/análisis.

La coincidencia numérica con el informe no autoriza copiar sus afirmaciones de significancia basadas en solapamiento de IC. El alcance de esta entrega es disponibilidad y presentación trazable de estimaciones, no contrastes nuevos.
