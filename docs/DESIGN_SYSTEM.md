# Sistema de diseño — ENCODAT · Informe interactivo de resultados

Registro editorial y científico, no panel de administración: el sitio se lee como un
informe con secciones, figuras numeradas y notas al pie, y se consulta con filtros que
alimentan a la vez la figura, la tabla y la descarga.

Referencia inspeccionada en esta ronda: la página de estimulantes sintéticos del
*European Drug Report 2024* de la EUDA. **Adaptado**: índice lateral persistente con
anclas; secciones narrativas seguidas de un bloque de hallazgos donde cada afirmación
cita su figura o su fuente; figuras numeradas («Figura 3») con título, explicación en
prosa, conmutador de tabla, notas al pie por figura y una línea de fuente propia; fecha
de última revisión visible; leyenda explicada con palabras además del color; divulgación
de método plegable por figura y por indicador. **Descartado**, con motivo: el mapa
interactivo con zoom y librería de gráficas (no se añaden librerías; la geografía son 9
regiones y un mapa navegable no aporta nada); la codificación rojo/verde/amarillo de
«aumento / estable / descenso» por ciudad (implica un juicio de cambio que aquí no se
puede sustentar, y el color quedaría como único portador); la descarga del informe en
PDF (no existe un PDF propio que ofrecer); el mosaico decorativo de la cabecera (sin
valor informativo); la tabla-liga de 30 países (aquí hay 9 regiones, con otra forma).

## 1. Tokens

Definidos una sola vez en `:root` de `app/globals.css` y espejados en
`tailwind.config.ts`. No hay capas de sobreescritura acumuladas.

**Color**

| Token | Valor | Uso |
|---|---|---|
| `--paper` | `#FAF9F5` | fondo de página, papel cálido |
| `--surface` | `#FFFFFF` | figuras, tarjetas, tablas |
| `--sunken` | `#F3F5F1` | pies de figura, encabezados de tabla |
| `--ink` | `#15211F` | texto principal |
| `--subink` | `#4A574F` | texto secundario, entradilla |
| `--faint` | `#5D6A62` | notas y ejes |
| `--line` / `--line-strong` | `#DDE3DC` / `#C3CCC3` | filetes y bordes de control |
| `--accent` | `#0B5A52` | marca, enlaces, serie de datos |
| `--accent-deep` | `#084741` | cifras grandes, estado activo |
| `--accent-hover` | `#0A6F64` | interacción |
| `--wash` | `#EAF2F0` | fondo de estado seleccionado y de aviso neutro |
| `--warn-ink` / `--warn-line` / `--warn-wash` | `#7A3D06` / `#B87333` / `#FBF1E3` | ausencia de dato y advertencia de precisión |
| series | `#1F2A3C` total · `#2E4A7D` hombres · `#9A4E11` mujeres | series categóricas |

Sin degradados en ningún elemento: la leyenda del mapa son seis muestras discretas, no
una franja interpolada.

**Tipografía**

- `--font-display` (serif: Iowan Old Style / Palatino / Georgia): título del informe,
  títulos de sección, títulos de figura y cifras grandes. Es la voz del informe.
- Sans (Inter / system-ui): texto corrido, interfaz, tablas.
- `.tnum` (`font-variant-numeric: tabular-nums`) en toda cifra, para que las columnas
  se alineen.
- `.kicker`: 11 px, 700, mayúsculas, `letter-spacing .12em`, color `--accent-deep`.
- Medida de lectura: `--measure: 68ch`.

**Espacio y forma**

Radios de 4–6 px (nada redondeado en exceso), secciones de 2,75 rem de aire vertical,
figuras con 1,5 rem de relleno interior, filete de 1 px como separador dominante y un
filete de 2 px bajo la entradilla del informe.

## 2. Contraste verificado (WCAG 2.1 AA)

Comprobado con el algoritmo de luminancia relativa de la WCAG, no de palabra. Mínimos
exigidos: 4.5:1 en texto, 3:1 en marcas de datos y bordes que portan información.

| Par | Ratio |
|---|---|
| `--ink` sobre `--paper` | 15.71:1 |
| `--subink` sobre `--paper` | 7.20:1 |
| `--faint` sobre `--surface` | 5.67:1 |
| `--accent` sobre `--surface` | 8.08:1 |
| `--accent` sobre `--wash` | 7.10:1 |
| blanco sobre `--accent` (botón primario) | 8.08:1 |
| blanco sobre `--accent-hover` | 6.05:1 |
| `--warn-ink` sobre `--warn-wash` | 7.52:1 |
| `--warn-line` sobre `--surface` (borde) | 3.79:1 |
| serie hombres sobre `--surface` | 8.78:1 |
| serie mujeres sobre `--surface` | 6.05:1 |
| serie total sobre `--surface` | 14.44:1 |

Escala secuencial del mapa, con el color de texto elegido por paso y su ratio:

| Paso | Color | Texto | Ratio |
|---|---|---|---|
| 1 | `#E4EFEB` | tinta | 14.06:1 |
| 2 | `#BCD9D3` | tinta | 11.03:1 |
| 3 | `#8DBFB7` | tinta | 8.09:1 |
| 4 | `#4E968D` | tinta | 4.78:1 |
| 5 | `#1F6E66` | blanco | 6.03:1 |
| 6 | `#08433D` | blanco | 11.17:1 |

El paso 1 no se separa del papel por sí solo (1.12:1), así que **toda** figura del mapa
lleva contorno `#6F7B73` (3.2:1 sobre el paso más claro) y la cifra impresa encima.

## 3. Escalas de datos (`lib/scale.ts`)

- Mapa y cartograma: `makeScale()` devuelve `color`, `text`, `step` y `breaks` sobre
  **seis clases discretas** entre el mínimo y el máximo del filtro actual. `tealScale()`
  se conserva para compatibilidad.
- Series categóricas: `SERIES` (total / hombres / mujeres), distinguibles en las tres
  formas más frecuentes de daltonismo y todas válidas también como color de texto.
- `NATIONAL_INK` para la referencia nacional cuando compite con regiones; `DATA_INK`
  para la serie por omisión.
- IC 95 %: barra con tapas en los extremos; el punto es la estimación. El punto se
  dibuja **hueco** cuando la precisión es media o baja, y la leyenda lo explica con
  texto.

## 4. Componentes

La interfaz reutilizable y sus firmas están en **`docs/REPORT_COMPONENTS.md`**.
Aquí solo lo que aporta cada pieza a la lectura:

- **`ReportNav`**: índice del informe, pegajoso en escritorio, en línea por debajo de
  980 px.
- **`ReportSection`**: numeración en el `eyebrow`, ancla, título y entradilla.
- **`FigureCard`**: figura numerada; el conmutador **Gráfica / Tabla** y el botón de
  descarga se alimentan del mismo array de filas.
- **`NationalHero`**: cifra grande con IC, barra de IC rotulada, CV con su advertencia,
  las **dos** N ponderadas etiquetadas y la trazabilidad de la cifra.
- **`RangePlot`**: filas enfocables con IC, ficha de detalle al pasar el cursor, al
  enfocar y al activar; eje con unidades; aviso de que las diferencias son descriptivas.
- **`RegionMap`**: coropleta de 9 regiones con cifra impresa, leyenda escalonada,
  selector de región y Sinaloa hachurado como «no incluido en la encuesta».
- **`DiffPlot`**: diferencias con línea de cero rotulada, IC y signo escrito.
- **`FilterBar`**: un solo selector de datos; opciones no comparables visibles,
  deshabilitadas y con su motivo.
- **`DataTable`**: orden por columna con `aria-sort`, paginación, búsqueda, descarga de
  todas las filas filtradas y dos columnas de N con su significado completo en el
  encabezado.
- **`Availability`**, **`MethodDisclosure`**, **`EstimateValue`**, **`WeightedN`**,
  **`SyntaxSourceTag`**: estados, método y cifras etiquetadas.

## 5. Navegación

`Informe · Explorar · Entre ediciones · Asociaciones · Datos · Metodología`.
Cabecera clara y pegajosa, con `aria-current="page"` y subrayado inferior en la sección
activa; menú de botón con `aria-expanded` y cierre con `Escape` por debajo de 760 px.

Rutas de comparación temporal: **`/comparar` es la ruta viva**;
`app/comparacion/page.tsx` es un alias de una línea que reexporta
`app/comparar/page.tsx` (`export { default, metadata } from "../comparar/page"`), de modo
que ambas URLs sirven la misma página. La navegación enlaza únicamente `/comparar`. El
alias pertenece al agente 3 y no se toca desde aquí; queda señalado para que el
coordinador decida si se retira.

`components/RegionCartogram.tsx` no lo importaba ningún archivo: se movió a
`_to_delete/RegionCartogram.tsx` (no hay permiso de borrado en la carpeta conectada).

## 6. Accesibilidad

- Enlace «Saltar al contenido»; `<main>` con `tabIndex={-1}` para recibir el foco.
- Foco visible de 3 px (`outline: 3px solid var(--ring)`) en enlaces, botones,
  `summary`, campos y grupos SVG enfocables. No se suprime en ningún selector.
- Objetivos táctiles de 44 px de alto mínimo en botones, enlaces de navegación,
  opciones del selector, encabezados ordenables y `summary`.
- Gráficas y mapa: `role="group"` con nombre, `<title>` descriptivo en el SVG,
  regiones enfocables con `role="button"`, `aria-pressed`, `Enter`/`Espacio` para
  seleccionar y `Escape` para deseleccionar.
- Tablas con `caption`, `scope="col"`, `aria-sort` y contenedor con `role="region"`,
  nombre y `tabIndex={0}` para desplazarse con teclado.
- Estados con `role="note"`; la carga con `role="status"` y `aria-live="polite"`.
- El color nunca es el único portador: cada figura imprime el valor, la leyenda se
  explica con palabras, el punto hueco marca la baja precisión y el mapa lleva la cifra
  sobre la región.
- `prefers-reduced-motion: reduce` desactiva transiciones, animaciones y el
  desplazamiento suave.

## 7. Comportamiento adaptativo

Verificado a 390, 820 y 1440 px de ancho.

- 1440 px: rejilla de dos columnas (índice de 210 px + cuerpo), mapa y gráfica en
  paralelo.
- 820 px: el índice pasa a una fila de enlaces, el mapa y la gráfica se apilan, los
  filtros pasan a dos columnas.
- 390 px: menú de botón, una sola columna, figuras a sangre de 20 px, ejes y etiquetas
  reducidos. El desplazamiento horizontal existe **solo** dentro de `.table-scroll`;
  la página nunca desplaza en horizontal.
- Todos los SVG usan `viewBox` y escalan; ninguna cifra se recorta.

## 8. Integridad (no negociable)

- No se altera ni se completa ningún dato. Gráfica, ficha al pasar el cursor, tabla y
  CSV muestran la misma observación.
- Toda N mostrada es ponderada y declara si es **población estimada de la categoría** o
  **población estimada del universo analítico**; `WeightedN` hace obligatoria esa
  etiqueta por tipo. Una N ausente es «No disponible»: no se sustituye por la n
  muestral ni se deduce del porcentaje.
- Análisis por **9 regiones**. Las entidades solo construyen geometrías; no hay
  estimaciones estatales. Sinaloa: «no incluido en la encuesta».
- Se muestran prevalencias, IC 95 % y advertencias de precisión (CV) cuando existen.
  Sin CV no se afirma precisión. No se deduce significancia del solapamiento de
  intervalos, y los únicos estados de un contraste son *cambio con evidencia
  estadística*, *sin evidencia suficiente de cambio* y *comparación no evaluable*.
- La referencia nacional conserva su universo nacional aunque se filtre una región, y
  la interfaz lo dice en el filtro, en la gráfica y en la tabla.
- Cada indicador declara la procedencia de su definición (`syntax_source`): sintaxis
  oficial o derivación propia del proyecto.
- El frontend no recalcula estimaciones desde microdatos.
