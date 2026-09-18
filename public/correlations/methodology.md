# Módulo de correlaciones — revisión estructural de pares

Ronda 2026-09-18 (agente 2). Sustituye la versión anterior de este documento.

> **Recálculo del 2026-09-18, posterior al cambio de la capa de análisis.** La Ola A
> cambió el criterio de confirmación del bloque `_av` de drogas ilegales: ya no es la
> regla del proyecto `di4x` entre 1 y 90, sino el **RECODE oficial** de la SINTAXIS,
> es decir `<sustancia>_ini != 99`. Mi guarda de integridad lo detectó
> (`indicators.json` de `d7534e83…` a `88b3cba0…`) y **el hash se actualizó porque se
> reejecutó la cadena completa, no porque se reescribiera a mano**. Consecuencias,
> todas comprobadas y no supuestas: el conjunto de códigos que confirman la edad pasa
> de 1–90 a **1–65 más 111, 119 y 120**; **ninguna clasificación se mueve** (0 de 820
> pares); y la evidencia del motivo `anidamiento_no_estricto_edad_de_inicio` se
> recalculó, con los contraejemplos bajando de **14 a 2**. Detalle en §5 y §11.

## 0. Lo esencial en diez líneas

- **Unidad de análisis: la persona.** Cada par es una tabla 2×2 sobre los mismos
  individuos de 12 a 65 años. No hay correlaciones entre regiones y ninguna cifra
  de este módulo describe una relación entre territorios.
- **Archivo vivo del módulo: `data/correlations_reviewed.json`.** Lo importa
  `lib/correlations.ts`. `data/correlations.json` **no** lo consume nadie en la
  app: es la publicación original de la ronda 1 y solo sirve como entrada del
  programa de revisión (`before_present`, `before_flagged_redundant`). No se toca.
- Universo: **820 pares** entre 41 indicadores. **81 excluidos**, **36 con la
  definición sin resolver**, **703 conservados**.
- De los 703 conservados, **21 publican cifras** (recalculadas y verificadas) y
  682 esperan cálculo o la liberación de su indicador.
- **Ni phi, ni el cociente de momios, ni el valor p, ni ningún umbral de
  asociación participan en la decisión de excluir.** Una asociación alta observada
  no excluye nada: los tres pares de mayor phi del módulo (conducta suicida,
  phi 0.47–0.50) se conservan y publican cifras.

## 1. Criterio

Se excluye un par cuando su dependencia es **estructural, lógica o matemática** y
se puede **demostrar con la construcción de las variables**. Si la dependencia es
plausible pero no demostrable con la evidencia disponible, el par **no se excluye**:
se marca `definition_pending` y se nombra qué falta, con cifras cuando existen.

## 2. Evidencia, toda auditable en el repositorio

| Fuente | Qué aporta |
|---|---|
| `encodat_analysis/src/derived_vars.py` (Ola A) | 89 variables derivadas con `source_variables`, `official_label`, `block`, `syntax_source` y `confirmation_rule`. De aquí sale el grafo agregado → componentes y las definiciones de `_av`, `_ua`, `_um`. **No se modifica.** El conjunto de códigos que confirman la edad de inicio **se deriva ejecutando** `recode_edad_inicio_oficial` sobre el dominio entero y conservando los que no dan 99: no está escrito a mano en este módulo, así que un nuevo cambio de criterio en la Ola A se propaga solo. |
| `encodat_analysis/correlations/evidence/sintaxis_extracto_um_y_derivadas.txt` | Extracto **literal** de la SINTAXIS SPSS oficial. `review_correlations.py` parsea sus `count`/`recode ... into` y comprueba contra ellos las listas de componentes del bloque `_um` (`p_um` = 14 sustancias, `pdi_um` = 10, `coc2_um` = coc+cra, `prev_um` ← `p_um`). |
| `encodat_analysis/correlations/evidence/questionnaire_routing.json` | **73 saltos del cuestionario**, cada uno con el conteo EXACTO de contraejemplos en el microdato: **0 en los 73**. Más **38 columnas raíz** verificadas sin faltantes (se aplican a la muestra completa). |
| `encodat_analysis/correlations/evidence/catalogo_valores.json` | Conjuntos de códigos de la hoja VALORES del catálogo, para el anidamiento de topes de frecuencia. |

Una afirmación de salto con un solo contraejemplo **aborta** `build_skip_evidence.py`:
una afirmación falsa no puede convertirse en evidencia.

## 3. Mecanismo único

Cada indicador se representa como condición positiva en forma normal disyuntiva
(DNF) sobre pares (columna del microdato, conjunto de códigos). A cada conjunción
se le añade su **clausura de saltos**: lo que el cuestionario exige para que esa
columna se haya podido responder. Entonces:

- `B ⇒ A` total: toda conjunción de B garantiza alguna conjunción de A.
- `B ⇒ A` parcial: alguna, no todas. Una rama completa de la construcción de B
  fuerza el positivo de A.
- Antecesor común: ninguno implica al otro, pero ambos exigen la misma condición
  impuesta por un salto para poder valer 1.

`dnf_complete = False` marca los indicadores cuya condición positiva no es
expresable con la evidencia disponible (escalas sumadas, conteos de síntomas:
`malestar_k10`, `dep_alcohol`, `dep_drogas`, `juego_apuestas`, `videojuegos`).
Esos pueden ser **antecedente** de una implicación a través de su condición
necesaria, nunca **consecuente**. Y un par con columnas disjuntas y sin salto
común **se conserva** aunque una de las dos condiciones no sea expresable: no hay
vía de construcción que pueda ligarlos.

## 4. Registro de exclusiones: 81 pares

| Motivo tipificado | Pares | Qué demuestra |
|---|---|---|
| `agregado_vs_componente` | 41 | Uno es un agregado que incluye al otro entre sus componentes declarados (`prev_av` ⊃ `cdi_av` ⊃ `mar_av`; `coc2_av` ⊃ `cra_av`; `drog_ile_av2` ⊃ `alu_av`). |
| `salto_del_cuestionario` | 13 | Un positivo del primero solo es posible si el segundo ya es positivo. Alcohol: AL4 solo se aplica a AL1=1 (**0 de 5 965** contraejemplos); AL8/AL9 y AL12/AL14/AL15 solo a AL4∈1–5 (**0 de 5 266**); TA1–TA7 y AL26/AL27 solo a AL4∈1–5. |
| `implicacion_parcial_por_componente_compartido` | 10 | Una rama completa fuerza el positivo del otro: `cdm_ua`/`prev_ua` y las cuatro drogas médicas `_av`; `prev_av` × `prev_ua`. |
| `base_condicionada_por_salto_comun` | 9 | Ninguno implica al otro, pero los dos exigen AL4∈1–5 y AL1=1 para poder valer 1. Fuera de esa subpoblación (11 231 de 19 200) ambos valen 0 **por el salto**, no por la respuesta. |
| `umbral_de_frecuencia_anidado` | 6 | Mismos reactivos con topes anidados: `binge(1,4)` ⊂ `binge(3,6)` ⊂ `binge(4,8)` ⊂ `binge(5,12)`, con los códigos del catálogo. |
| `ventana_temporal_anidada` | 2 | `cdm_ua` = `cdm_av` ∧ DM6∈1–5: contención **literal** por conjunción, con 0 contraejemplos. |
| **Total** | **81** | |

Reglas implementadas que **no** se activan y por qué, dicho explícitamente:

- `variable_derivada_identica`: 0. Ningún par del módulo usa la misma variable.
- `misma_respuesta_recodificada`: 0.
- `categoria_complementaria_suma_fija`: 0. Se comprueba sobre las condiciones
  positivas declaradas; ningún par del módulo parte de la misma respuesta con
  códigos disjuntos. Los indicadores de alcohol y tabaco vienen de preguntas
  distintas, y las cuatro variantes de consumo excesivo son anidadas, no
  complementarias.
- `conteos_ponderados_por_tamano_poblacional`: **no aplica**. Los 41 indicadores
  son proporciones binarias sobre personas (`kind == "prop"`, comprobado como
  aserción al construir el grafo: un indicador de conteo detiene la revisión).
  Ninguna correlación del módulo se calcula sobre conteos ponderados, así que no
  puede reflejar diferencias de tamaño poblacional.

## 5. Definiciones sin resolver: 36 pares, nombradas

| Motivo | Pares | Qué falta, con cifras |
|---|---|---|
| `anidamiento_no_estricto_edad_de_inicio` | 30 | DI6x solo se pregunta a quien declaró DI1x=1, pero «alguna vez» exige además que el **RECODE oficial** confirme la edad (`<sustancia>_ini != 99`). `_ua` no exige esa confirmación, así que **la contención no está garantizada por construcción**. Corroboración en el microdato vigente: **2 personas** son positivas en «último año» sin serlo en «alguna vez», ambas de **mariguana** (filas 9293 y 10233, con `di1a = 1`, `di6a = 2` y `di4a = 999`, que el recode manda a faltante). Las otras nueve sustancias quedan en **0**. Hay que decidir si «alguna vez» debe seguir exigiendo esa confirmación. |
| `universo_de_dependencia_sin_resolver` | 6 | `dep_drogas` se calcula sobre consumidores del último año construidos con DI6/DM6 **sin** exigir DM3x1=1 (sin receta), mientras `prev_ua`/`cdm_ua` sí lo exigen. Las dos bases no se han demostrado equivalentes. Dato medido: TU1–TU7 lo responden exactamente 843 personas, 0 fuera de ese conjunto. |

## 6. Comparación antes y después

### Frente a la publicación original (`data/correlations.json`, intacta)

- 600 pares publicados, **84 marcados `redundante`** sin justificación estructural,
  **16 cocientes de momios negativos**.
- De esos 600, hoy: **78 excluidos**, 32 con la definición pendiente, **490 conservados**.
- De los 84 marcados `redundante`: 65 quedan excluidos **con evidencia**, 10 pasan a
  definición pendiente y **9 se recuperan y se conservan**. Son exclusiones previas
  injustificadas: la marca no tenía base estructural.

**Los 9 pares recuperados** (phi publicado en la ronda 1):
`alc_alguna_vez|drogaileg_alguna_vez` (0.199), `alc_alguna_vez|cannabis_alguna_vez`
(0.191), `alc_alguna_vez|cocaina_alguna_vez` (0.101), `cannabis_alguna_vez|heroina_alguna_vez`
(0.097), `alc_alguna_vez|ats_alguna_vez` (0.069), `alc_alguna_vez|inhalables_alguna_vez`
(0.056), `alc_alguna_vez|crack_alguna_vez` (0.054), `alc_alguna_vez|ats_ult_ano` (0.030),
`alc_alguna_vez|heroina_alguna_vez` (0.021). Motivo de conservarlos: son sustancias
distintas, sus columnas de origen son disjuntas y ningún salto del cuestionario las
liga. Que estén asociadas no es una dependencia de construcción.

### Frente a la ronda anterior del módulo

Reproducido par por par con `encodat_analysis/correlations/prev_round_diff.py` (reimplementa el
clasificador anterior, que era una función pura de los identificadores).

| | Ronda anterior | Ronda actual |
|---|---|---|
| Excluidos | 72 | **81** |
| Definición pendiente | 42 | **36** |
| Conservados | 706 | **703** |
| Con cifras publicadas | 36 | **21** |

**Exclusiones retiradas: 0.** Ninguna exclusión de la ronda anterior resultó
injustificada. Los 11 cambios de estado son:

- 8 `definition_pending → excluded`: 5 de `dep_alcohol` con alcohol de último mes y
  con consumo excesivo (base condicionada por AL4), 2 de `dep_alcohol` con
  `alc_alguna_vez` y `alc_ult_ano` (implicación por salto), y
  `droga_cualq_alguna_vez|droga_cualq_ult_ano` (implicación parcial por la rama
  médica). En los tres casos la ronda anterior no tenía la evidencia del salto y
  dejó el par en espera; ahora está verificada con 0 contraejemplos.
- 2 `candidate → definition_pending`: `dep_drogas` con `drogaileg_alguna_vez` y con
  `drogamedica_alguna_vez`, por el mismo desajuste de universo que ya afectaba a
  los otros cuatro pares de `dep_drogas`.
- 1 `candidate → excluded`: `alc_ult_mes|alc_excesivo_ult_ano`. La ronda anterior
  lo conservaba como excepción explícita y sin motivo declarado, mientras excluía
  los otros 11 pares equivalentes. Se excluye por coherencia y con evidencia: los
  dos indicadores solo pueden valer 1 entre quienes bebieron en los últimos 12
  meses. **Corrección de fondo:** el motivo que la ronda anterior usaba para esos
  pares (`consumption_subset`, «consumir excesivamente en esta ventana requiere
  consumo en la misma ventana») era **incorrecto** para `alc_ult_mes`: AL12/AL14/AL15
  son preguntas de frecuencia habitual con referencia de 12 meses, no de 30 días,
  así que no hay anidamiento de ventanas. La dependencia real es la base común.

Los demás cambios son de **nombre del motivo**, no de veredicto: 41
`total_component_or_nested` → `agregado_vs_componente`, 30
`lifetime_age_confirmation_mismatch` → `anidamiento_no_estricto_edad_de_inicio`
(ahora con el conteo exacto), 9 `composite_shared_component` →
`implicacion_parcial_por_componente_compartido`, etc.

## 7. Resultados: 21 pares con cifras

Se conservan los 36 pares calculados y verificados, pero **solo publican cifras los
21 cuyos dos indicadores tienen `allow_results: true`** en `release_manifest.json`.

Los 15 restantes involucran `tab_fumado_ult_mes` o `ecig_ult_mes`, que el manifiesto
marca `allow_results: false` («falta verificar definición, denominador y celdas
publicadas»). Si el denominador de un indicador no está verificado, una tabla 2×2
sobre ese denominador tampoco lo está. Quedan con `analytical_status =
withheld_release_gate`, sin cifras y con su motivo visible, **fuera** de matrices,
rankings, resúmenes y exportaciones.

**La familia de multiplicidad no se reduce:** sigue siendo la predeclarada de 36
pares, y los 15 retenidos cuentan en el denominador del ajuste de Holm. Reducirla a
21 a posteriori sería anticonservador. De los 21 publicados, **16 tienen evidencia
estadística** tras el ajuste.

Las tres asociaciones más fuertes del módulo se conservan y publican:

| Par | phi (IC 95 %) | Momios | p Holm |
|---|---|---|---|
| Ideación × intento de suicidio | 0.496 (0.426–0.560) | 437.7 | 6.9e-272 |
| Ideación × plan de suicidio | 0.471 (0.393–0.543) | 132.4 | 3.3e-208 |
| Intento × plan de suicidio | 0.466 (0.369–0.553) | 220.7 | 2.5e-219 |

Evidencia de que son construcciones distintas y no un artefacto: AS10, AS11 y AS12
se aplican a **toda la muestra** (0 faltantes en 19 200) y hay contraejemplos en
ambos sentidos: **83** personas con plan sin ideación, **22** con intento sin
ideación, **53** con intento sin plan. No hay salto entre ellas.

## 8. Diseño, N ponderadas y unidad de análisis

- **Unidades del método, declaradas aparte:** 19 200 observaciones, 92 estratos,
  798 UPM, 14 estratos con una sola UPM. Ninguna N ponderada se usa como tamaño de
  muestra ni se deriva de ella.
- **N ponderadas, siempre etiquetadas:** `weighted_joint_n` es *población estimada
  de la categoría* (personas con ambas condiciones) y `weighted_denominator_n` es
  *población estimada del universo analítico del par*. Las dos etiquetas viajan en
  el JSON y en el CSV (`weighted_n_meaning`, `weighted_denominator_meaning`) y el
  componente `WeightedN` exige declarar el universo por tipo.
- **La unidad es la persona, no la región.** `region_count` es `null` y el módulo lo
  dice en la interfaz. Si alguna vez se calculan asociaciones regionales, las
  unidades serían 9 regiones y no podrían interpretarse como relaciones entre
  personas: son dos inferencias distintas y no se mezclan.

## 9. Verificación

`verify_and_package.py` aborta el empaquetado si algo falla. Resultado actual:

| Comprobación | Resultado |
|---|---|
| Condiciones positivas declaradas vs. la derivación real de `indicators.py`, persona por persona | **14 de 14 coinciden**, 0 discrepancias |
| Celdas 2×2 ponderadas y phi, recalculadas en numpy contra la capa de R | error máx. phi **1.0e-15**, N conjunta 1.7e-08, denominador 5.1e-07 |
| Error estándar de phi por linealización de Taylor | error máx. **5.6e-17** |
| Holm reverificado desde los p crudos sobre la familia de 36 | error máx. **1.0e-15** |
| Saltos del cuestionario | 73 afirmaciones, **0 contraejemplos**; 38 columnas raíz sin faltantes |
| Manifiesto de integridad | **19 rutas, 0 discrepancias** tras reejecutar la cadena |
| Invariancia de la decisión al criterio de edad | reclasificación con 3 conjuntos distintos de códigos: **0 pares cambian** |
| Pruebas | `tests/test_review.py` 28/28; `scripts/test_correlations_contract.cjs` OK |
| `npx tsc --noEmit` y `next build` | sin errores |

**Lo que NO se reprodujo aquí, dicho sin rodeos:** el valor p crudo (`p_raw`) viene
de la prueba F de Rao–Scott que produjo la capa de R con el paquete `survey`
(`survey_pairs.R`). Este entorno no tiene R ni `scipy`, así que **no** se recalculó
y **no** se afirma haberlo reproducido. Lo que sí se reverificó es el ajuste de
Holm, que es una función determinista de esos p crudos. Tampoco se afirma
reproducir la varianza oficial publicada por la ENCODAT.

## 10. Archivos

### Capa de análisis — `encodat_analysis/correlations/`

| Archivo | Papel |
|---|---|
| `build_skip_evidence.py` | Lee microdato y catálogo; verifica cada salto y cada columna raíz; escribe `evidence/`. Aborta si una afirmación es falsa. |
| `derivation_graph.py` | Grafo de construcción, DNF, clausura de saltos e implicación. No lee microdatos. |
| `review_correlations.py` | Clasifica los 820 pares y escribe el registro. No lee microdatos. Comprueba el grafo de agregados contra `source_variables` y contra la sintaxis literal. |
| `verify_and_package.py` | Verificación independiente, reverificación de Holm, puerta de liberación y empaquetado. |
| `survey_pairs.R`, `run_validated_subset.R` | Procedencia de `p_raw` (Rao–Scott) y de los IC. **Se conservan**: son la única documentación de ese cálculo. Sus rutas están fijas al disco original. |
| `tests/test_review.py` | 25 pruebas de la selección y del empaquetado. |
| `evidence/` | Sintaxis literal, saltos verificados, valores del catálogo. |
| `output/` | Copia **auditable** del registro (conserva las cifras de los pares retenidos) y CSV. |
| `_to_delete/validate_and_package.py` | Retirado: rutas fijas inejecutables, no aplicaba la puerta de liberación, no verificaba las condiciones declaradas. Ver `_to_delete/LEEME.md`. **No borrado**: la decisión es del usuario. |

### Interfaz — `encodat_explorer/`

| Archivo | Papel |
|---|---|
| `data/correlations_reviewed.json` | **Archivo vivo.** Copia para la interfaz: misma decisión y misma evidencia, sin duplicar los metadatos del grafo (se declaran una vez en `indicators`) y sin las cifras de los pares retenidos. |
| `lib/correlations.ts` | Tipos, la puerta que filtra matrices/rankings/exportaciones, y los CSV del registro. |
| `components/Correlations.tsx` | Cinco secciones sobre los componentes compartidos del agente 1. |
| `app/correlaciones/page.tsx` | Sin cambios. |
| `public/correlations/*.csv` | Registro descargable: exclusiones, pendientes, revisión completa, resultados. |
| `scripts/test_correlations_contract.cjs` | Contrato del módulo. |

### Cómo regenerar

```bash
cd <raíz>
python3 encodat_analysis/correlations/build_skip_evidence.py --root . --out encodat_analysis/correlations/evidence
python3 encodat_analysis/correlations/review_correlations.py  --source-root . --delivery-root .
python3 encodat_analysis/correlations/verify_and_package.py   --source-root . --delivery-root .
cd encodat_analysis/correlations && ENCODAT_ROOT=<raíz> python3 -m unittest discover -s tests
cd encodat_explorer && node scripts/test_correlations_contract.cjs
```

Nada de esto modifica los microdatos originales ni las bases de origen, y no
cambia ningún otro análisis que use legítimamente esas variables.

---

## 11. Recálculo tras el cambio del criterio `_av` (2026-09-18)

### Qué cambió aguas arriba

`derived_vars._av_ile` pasó de `di1x == 1 ∧ di4x ∈ [1, 90]` a
`di1x == 1 ∧ recode_edad_inicio_oficial(di4x) != 99`. El RECODE oficial rescata
111, 119 y 120 como 11, 19 y 20, y manda 0, 999 y `66 thru hi` a 99. El conjunto de
códigos que confirman pasa de **1–90** a **1–65 ∪ {111, 119, 120}** (68 códigos):
pierde 66–90 y gana los tres rescatados. Cambian las 10 `*_av` ilegales y todo lo
construido sobre ellas. Cada variable derivada declara ahora `confirmation_rule`,
que vale `edad_inicio_valida_recode_oficial` en esas 10 y `null` en las otras 79.

### Qué hice en mi módulo

1. **`derivation_graph.py`**: el conjunto de códigos válidos ya no se declara, se
   **calcula** evaluando `recode_edad_inicio_oficial` sobre el dominio entero. `Node`
   lleva `confirmation_rule` y la evidencia del grafo la publica.
2. **`build_skip_evidence.py`**: el diagnóstico de contención ya no reimplementa las
   definiciones, **evalúa las variables derivadas de la Ola A** (`<sustancia>_av` y
   `<sustancia>_ua`) con `derived_vars.get`. Así no puede volver a quedar desfasado
   en silencio. Además publica las filas contraejemplo con sus valores crudos.
3. **`review_correlations.py`**: el motivo del anidamiento separa lo estructural de
   lo empírico y dice cuál es cuál.

### Qué NO cambió, comprobado y no supuesto

**Ninguna clasificación se mueve: 0 de 820 pares** cambian de estado, de motivo o de
estado analítico. Se comprobó de dos maneras:

- Diff par por par contra la instantánea previa al cambio.
- **Prueba de invariancia**: se reclasificó con tres conjuntos de códigos
  deliberadamente distintos (la regla previa 1–90, solo 1–65, y uno absurdo 1–3) y la
  clasificación es idéntica en los tres. La razón es estructural: el átomo `di4x`
  aparece con el **mismo** conjunto en los dos lados de toda implicación que lo usa,
  así que la prueba de subconjunto no se entera; y la regla del anidamiento elimina
  `di4x` antes de comparar. Queda como prueba de regresión
  (`test_classification_is_invariant_to_the_age_code_set`).

Tampoco cambian los resultados: los 36 pares calculados y los 21 publicados son los
mismos, con las mismas cifras, y la puerta de liberación sigue bloqueando a
`tab_fumado_ult_mes` y `ecig_ult_mes`. Esos 9 indicadores no usan el bloque `_av`.

### Contención `_ua` → `_av` recalculada, por sustancia

| Sustancia | `_ua` positivos | `_av` positivos | `_ua` sin `_av` | ¿Contenido? |
|---|---|---|---|---|
| mariguana (`mar`) | 457 | 2 151 | **2** | no |
| cocaína (`coc`) | 103 | 721 | 0 | sí, en estos datos |
| crack (`cra`) | 20 | 154 | 0 | sí, en estos datos |
| alucinógenos (`alu`) | 46 | 248 | 0 | sí, en estos datos |
| inhalables (`inh`) | 27 | 171 | 0 | sí, en estos datos |
| heroína (`her`) | 5 | 35 | 0 | sí, en estos datos |
| fentanilo (`fent`) | 10 | 36 | 0 | sí, en estos datos |
| ATS (`met`) | 59 | 276 | 0 | sí, en estos datos |
| otras (`otr`) | 9 | 31 | 0 | sí, en estos datos |
| cannabinoides sintéticos (`marsin`) | 9 | 30 | 0 | sí, en estos datos |
| **Total** | | | **2** (antes 14) | |

Los dos contraejemplos son las filas **9293** y **10233**: `di1a = 1`, `di6a = 2`,
`di4a = 999`, y el recode oficial manda 999 a 99.

### ¿Se puede resolver alguno de los 30 pares pendientes? No

**Ninguno.** Nueve de las diez sustancias ya no muestran contraejemplos, pero eso es
un **hecho de estos datos, no una garantía de construcción**: `_ua_ile` sigue siendo
`di6x ∈ 1..5` y no exige en ningún punto que el RECODE confirme la edad. Nada impide
que un caso como el de mariguana aparezca en cocaína; de hecho el mecanismo es el
mismo y está vivo en este archivo. Liberar esos pares sería exactamente lo que este
módulo tiene prohibido: decidir por lo observado en lugar de por la construcción.

Por eso el motivo de cada par pendiente ahora enuncia primero la razón estructural y
solo después el conteo, marcado como corroboración (`contraejemplos_son_corroboracion:
true`). Un par cuya sustancia muestra 0 contraejemplos lo dice sin fingir que la
contención se cumple:

> «La contención no está garantizada por construcción: `_ua` no exige la confirmación
> por edad de inicio que `_av` sí exige. En el microdato vigente no se observa ningún
> contraejemplo para coc, cra, pero eso es un hecho de estos datos, no una garantía:
> el mismo mecanismo sí rompe la contención en mariguana.»

**Lo que resolvería estos 30 pares** no es más evidencia empírica, sino una decisión
de definición: o `_av` deja de exigir la confirmación por edad, o `_ua` pasa a
exigirla. Cualquiera de las dos hace la contención demostrable y los 30 pares pasarían
a `ventana_temporal_anidada`. No es una decisión de este agente.
