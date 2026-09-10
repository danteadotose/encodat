# Sistema de diseño — ENCODAT 2025 Explorer

Estética editorial y científica (tipo *Our World in Data*): mucho espacio en blanco,
tipografía clara, gráficas y mapa protagonistas, transiciones discretas.

## Tokens (tailwind.config.ts)
**Color**
- `paper` #FBFAF6 (fondo), `surface` #FFFFFF (tarjetas)
- `ink` #1A1813 (texto), `subink` #57564E, `faint` #8A887E, `line` #E7E3D8
- `teal` — wash #E3F0EF · soft #6FABAF · DEFAULT #137A80 · deep #0C4F53 · ink #093B3E (marca + datos)
- `amber` #B4611F, `indigo` #33517E (series categóricas colorblind-safe: azul/naranja)

**Tipografía**
- `font-display` — serif editorial (Iowan Old Style / Palatino / Georgia). Títulos y cifras.
- `font-sans` — Inter / system-ui. Texto e interfaz.
- `.tnum` — numerales tabulares para todas las cifras.
- `.kicker` — eyebrow: 11px, 600, mayúsculas, tracking .14em, color teal-deep.

**Otros**: `max-w-measure` 62ch · radios `rounded-xl/2xl` · sombras `shadow-card` (sutil) y `shadow-lift` (hover) · `transition-soft` 160ms.

## Escalas de datos (lib/scale.ts)
- Mapa/coroplético: **secuencial de un tono** (teal wash → deep). `makeScale()` mapea min–max.
- Series categóricas (sexo): total=ink, hombres=indigo, mujeres=amber (distinguibles en daltonismo).
- IC 95%: whisker con tapas; punto = estimación. Leyenda visible en cada gráfica.

## Componentes y estados
- **NationalHero**: cifra grande + IC + barra de IC; rejilla de metadatos que distingue
  **muestra (n, sin ponderar)** de **población (N, ponderada)**, casos y CV.
- **RangePlot** (dot/forest): ejes con % y cuadrícula tenue; etiqueta de valor directa; fila
  enfatizada con fondo suave; tooltip fijo que no se sale de pantalla.
- **RegionMap**: contornos estatales coloreados por su región; leyenda menor→mayor + rango;
  Sinaloa "no incluido" (hachurado); al seleccionar una región se atenúan las demás.
- **Controles**: `select` de indicador (agrupado por categoría) + segmentados de sexo/edad,
  sincronizados con la URL. `aria-pressed`, `aria-current`, foco visible.
- **ValidationBadge / punto**: coincide (teal) · aproximado (amber) · difiere/sin ref (gris).

## Accesibilidad
- Enlace "saltar al contenido"; foco visible (outline teal 2px); `aria-label`/`role="img"` en SVG.
- Navegación con teclado en nav, filtros, `select`, tabla (encabezados con `aria-sort`).
- Contraste AA en texto y en colores de datos; el color nunca es el único portador (valor/etiqueta presentes).
- `prefers-reduced-motion`: desactiva transiciones.

## Responsive
- SVG con `viewBox` (escalan); tarjetas refluyen (1→2→3 columnas); tabla con scroll horizontal
  propio (`overflow-x-auto`), el body nunca hace scroll horizontal.

## Integridad (no negociable)
- No se alteran datos ni cifras; gráfica, tooltip, tabla y CSV usan la misma observación.
- Las N son ponderadas; la n es la muestra sin ponderar — etiquetadas sin ambigüedad.
- Análisis **por 9 regiones**, nunca por estado. Sinaloa "no incluido".
