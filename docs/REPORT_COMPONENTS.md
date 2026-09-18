# Interfaz visual reutilizable del informe

Conjunto estable que **los agentes 2 y 3 consumen sin editarlo** (punto 6 de
`COORDINACION_2026_09_17.md`). Si una prop no alcanza, se pide al coordinador: no se
edita el componente ni se duplica su lógica.

- Los ocho componentes se importan **desde `@/components/Report`**.
- Los átomos presentacionales viven en `@/components/ui` y `Report` los reexporta, así
  que ambas rutas de importación funcionan:
  `ReportSection`, `FigureCard`, `MethodDisclosure`, `ReportNav`, `DiffPlot` y `FilterBar`
  se definen en `Report.tsx`; `Availability`, `EstimateValue`, `WeightedN`,
  `SyntaxSourceTag` y `NationalScopeNote` en `ui.tsx`.
- `Report.tsx` es `"use client"` (FigureCard, FilterBar y DiffPlot tienen estado).
  `ui.tsx` **no** lo es: sus componentes son puros y sirven igual en servidor y cliente.
- Ninguna firma anterior cambió. Todo lo nuevo es opcional, salvo `WeightedN.kind`,
  que es obligatorio a propósito (ver más abajo).

---

## 1. `ReportSection`

```ts
ReportSection(props: {
  id: string;                 // ancla navegable; el título recibe id `${id}-title`
  eyebrow?: string;           // p. ej. "02 / Territorio"
  title: string;
  description?: ReactNode;
  children: ReactNode;
}): JSX.Element
```

```tsx
<ReportSection id="comparabilidad" eyebrow="02 / Comparabilidad"
  title="Qué pares admiten comparación"
  description="Cada par declara su criterio antes de mostrar una diferencia.">
  {…}
</ReportSection>
```

## 2. `FigureCard`

Figura numerada con dos modos. El modo conmutable es el que exige la coordinación:
**gráfica y tabla sobre los mismos datos y los mismos filtros**, más la descarga de
esas mismas filas.

```ts
FigureCard(props: {
  number: string | number;
  title: string;
  description?: ReactNode;
  // modo heredado
  children?: ReactNode;
  footer?: ReactNode;
  // modo conmutable (chart + table activan el conmutador)
  chart?: ReactNode;
  table?: ReactNode;
  legend?: ReactNode;              // se muestra solo en la vista de gráfica
  source?: ReactNode;              // línea de fuente, en el pie de la figura
  notes?: ReactNode;               // notas al pie de la figura
  onDownload?: () => void;
  downloadLabel?: string;          // "Descargar datos de la figura"
  downloadDisabled?: boolean;
  view?: "grafica" | "tabla";      // controlado por el padre (p. ej. desde la URL)
  onViewChange?: (v: "grafica" | "tabla") => void;
  defaultView?: "grafica" | "tabla";
  viewLabels?: { chart: string; table: string };
}): JSX.Element
```

Reglas de uso: `chart`, `table` y `onDownload` deben derivar del **mismo array de
filas**. Si hay dos arrays, hay dos fuentes de verdad y la figura miente.

```tsx
const rows = selectPairs(filters);            // un único selector de datos
<FigureCard number="3" title="Diferencia entre ediciones"
  description="Puntos porcentuales, con referencia en cero."
  view={view} onViewChange={setView}
  chart={<DiffPlot items={rows.map(toDiffItem)} ariaLabel="Diferencias 2016–2017 a 2025" />}
  table={<TemporalTable rows={rows} />}
  onDownload={() => downloadTemporalCsv(rows)}
  downloadDisabled={!rows.length}
  notes={<p>La descarga entrega exactamente estas filas.</p>}
  source={<>Fuente: {rows[0]?.source_locator ?? "No disponible"}.</>} />
```

## 3. `Availability`

Estado honesto con el motivo **visible** (no en un tooltip). El estado se distingue por
texto y por borde, no solo por color.

```ts
type AvailabilityState = "disponible" | "no-disponible" | "no-evaluable" | "pendiente" | "cargando";

Availability(props: {
  state?: AvailabilityState;   // por omisión "no-disponible"
  title?: string;              // si falta, se usa el rótulo del estado
  reason?: string;             // el motivo, siempre visible
  children?: ReactNode;
  className?: string;
}): JSX.Element
```

`state="cargando"` emite `role="status"` con `aria-live="polite"`; el resto, `role="note"`.

```tsx
<Availability state="no-evaluable" title="Comparación no evaluable"
  reason="El universo de 2016–2017 no es enlazable a estratos ni UPM, así que no hay varianza de diseño." />
```

## 4. `MethodDisclosure`

Método, fuente, definición operacional, **`syntax_source` de la variable derivada** y
advertencias de precisión. El bloque de procedencia se imprime siempre: si no hay
`syntaxSource`, dice que la fuente no la declara.

```ts
MethodDisclosure(props: {
  title?: string;                       // "Fuentes y método"
  children?: ReactNode;
  method?: ReactNode;
  source?: ReactNode;
  definition?: ReactNode;
  derivedVariable?: string | null;      // p. ej. "prev_um"
  syntaxSource?: "oficial" | "reconstruccion_proyecto" | null;
  syntaxNotes?: ReactNode;
  sourceVariables?: string[] | null;    // columnas del microdato
  precision?: ReactNode;                // si falta, texto por omisión sobre IC/CV
  open?: boolean;
}): JSX.Element
```

## 5. `EstimateValue`

```ts
EstimateValue(props: {
  estimate?: number | null;             // null → "No disponible" + motivo
  ciLow?: number | null; ciHigh?: number | null;
  unit?: string;                        // "%" o una unidad con "años" → media
  cv?: number | null;
  reliability?: string;                 // "alta" | "media" | "baja"
  size?: "hero" | "lead" | "inline";
  digits?: number;
  missingReason?: string;
  label?: string;
}): JSX.Element
```

Imprime siempre el IC 95 % y el CV, y «No disponible» cuando falta cualquiera de los
dos. La advertencia de precisión aparece solo si hay CV: sin CV no se afirma precisión
(`visibleReliability` en `lib/format.ts`).

## 6. `WeightedN`

```ts
type WeightedNKind = "categoria" | "universo";

WeightedN(props: {
  value: number | null | undefined;
  kind: WeightedNKind;        // OBLIGATORIO
  hint?: string;
  missingReason?: string;
  compact?: boolean;
}): JSX.Element
```

`kind` es obligatorio por tipo: **no existe forma de mostrar una N sin declarar si es
población estimada de la categoría o población estimada del universo analítico**. Un
`value` nulo imprime «No disponible» con su motivo; el componente nunca acepta ni
muestra una N muestral, ni deduce el conteo a partir del porcentaje.

```tsx
<WeightedN value={rec.weighted_n} kind={weightedNKind(rec.weighted_n_meaning) ?? "categoria"} />
<WeightedN value={rec.pop} kind="universo" />
```

Para datos propios, traduce el significado con `weightedNKind(meaning)` de
`lib/format.ts`; si tu fuente no declara el significado, usa el `kind` que corresponda
al campo por esquema y documéntalo, no lo adivines fila a fila.

## 7. `DiffPlot`

Diferencias en puntos porcentuales con **referencia en cero** e IC. La línea de cero está
siempre visible y rotulada, y el signo se escribe además de dibujarse.

```ts
interface DiffItem {
  key: string;
  label: string;
  diff: number | null;                  // null → "No disponible", sin marca
  ciLow?: number | null; ciHigh?: number | null;
  state?: "evidencia" | "sin_evidencia" | "no_evaluable";
  reason?: string;                      // motivo cuando no es evaluable
  detail?: ReactNode;
}

DiffPlot(props: {
  items: DiffItem[];
  unit?: string;                        // "%" → pp; unidad con "años" → años
  domain?: number;                      // simétrico: −domain a +domain
  ariaLabel?: string;
  zeroLabel?: string;                   // "Sin cambio (0)"
  comparability?: ReactNode;            // estado de comparabilidad del conjunto
  harmonization?: ReactNode;            // explicación de la armonización aplicada
}): JSX.Element
```

`state` lo aporta quien llama, con los **tres únicos valores admitidos**
(`CONTRAST_LABEL` en `lib/format.ts`). El componente **no** deduce el estado del hecho
de que el intervalo cruce o no el cero, y lo dice en la nota al pie.

```tsx
<DiffPlot
  items={pairs.map(p => ({
    key: p.id, label: p.region_name ?? "Nacional",
    diff: p.diff_pp, ciLow: p.diff_ci_low, ciHigh: p.diff_ci_high,
    state: p.contrast_state,                       // de la capa de análisis
    reason: p.contrast_state === "no_evaluable" ? p.reason : undefined,
    detail: <><WeightedN value={p.pop_2025} kind="universo" compact /></>,
  }))}
  unit="%" ariaLabel="Diferencia 2016–2017 a 2025 por región"
  comparability={<Availability state="no-evaluable" title="Comparabilidad parcial"
    reason="Sinaloa no está en 2025: la región Noroccidental y el nacional no comparten cobertura entre ediciones." />}
  harmonization={<MethodDisclosure title="Armonización aplicada"
    definition="Se igualaron periodo de referencia y grupo de edad antes de restar."
    method="Diferencia de proporciones sobre resultados publicados; la varianza de 2016–2017 no es estimable con la base individual aportada."
    syntaxSource="reconstruccion_proyecto" />} />
```

## 8. `FilterBar`

Un **único selector de datos** para la gráfica, la tabla y la descarga. Una combinación
no comparable se deja **visible y deshabilitada**; al activarla se muestra su motivo en
lugar de cambiar la selección en silencio.

```ts
interface FilterOption {
  value: string; label: string; hint?: string;
  disabled?: boolean;
  disabledReason?: string;   // en la práctica obligatorio si disabled
}
interface FilterGroup {
  id: string; label: string; value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  control?: "segmented" | "select";   // segmented por omisión (2–4 opciones)
  note?: ReactNode;
}

FilterBar(props: {
  title?: string;                  // "Selección de datos"
  groups: FilterGroup[];
  lead?: ReactNode;                // control propio, p. ej. el buscador de indicadores
  note?: ReactNode;
  onReset?: () => void;
  resetLabel?: string;
  nationalScopeNote?: boolean;     // por omisión true: recuerda que el nacional no cambia
  children?: ReactNode;
}): JSX.Element
```

Los grupos con `control: "select"` se agrupan en una segunda fila junto al aviso de
universo nacional y al botón de restablecer.

```tsx
<FilterBar
  groups={[
    { id: "edad", label: "Edad (años)", value: age, onChange: setAge,
      options: AGES.map(a => ({ value: a, label: a,
        disabled: !comparableAges.includes(a),
        disabledReason: `El grupo ${a} no es comparable entre ediciones: la pregunta de 2016–2017 usa otro universo.` })) },
    { id: "region", label: "Región", value: region, control: "select", onChange: setRegion,
      options: [{ value: "", label: "Todas las regiones" }, ...REGIONS.map(r => ({
        value: String(r.region_id), label: r.name,
        disabled: !comparableRegions.has(r.region_id),
        disabledReason: "Esta región no comparte cobertura territorial entre las dos ediciones." }))] },
  ]}
  note="Esta selección alimenta la gráfica, la tabla y la descarga." />
```

---

## Para una sección de comparación temporal (agente 3)

Lo que la interfaz ya cubre, sin tocar los componentes:

| Necesidad | Con qué |
|---|---|
| Dos ediciones con su IC | `EstimateValue` por edición (`size="lead"`) dentro de `FigureCard` |
| Gráfica de diferencias con referencia en cero | `DiffPlot` (`items[].diff`, `ciLow`, `ciHigh`) |
| Estado de comparabilidad | `DiffPlot.comparability` y/o `Availability state="no-evaluable"` |
| Explicación de la armonización | `DiffPlot.harmonization` o `MethodDisclosure` |
| Tres estados de contraste y solo esos | `DiffItem.state` + `CONTRAST_LABEL` de `lib/format.ts` |
| Combinaciones no comparables | `FilterOption.disabled` + `disabledReason` |
| Cobertura distinta entre ediciones | `Availability` con el motivo (Sinaloa, Noroccidental, nacional) |
| Misma tabla y misma descarga | `FigureCard` con `chart`/`table`/`onDownload` desde un solo array |
| N ponderada de cada edición | `WeightedN` con su `kind` |

## Para una matriz de correlaciones con exclusiones (agente 2)

| Necesidad | Con qué |
|---|---|
| Matriz y su tabla equivalente | `FigureCard` con `chart` = matriz SVG y `table` = pares |
| Pares excluidos, visibles y con motivo | `Availability state="no-evaluable"` por motivo, o `FilterOption.disabled` |
| Método, dominio y umbrales | `MethodDisclosure` (`method`, `definition`, `precision`) |
| Procedencia de cada indicador del par | `SyntaxSourceTag source={...} variable={...}` |
| Denominador del par | `WeightedN kind="universo"` |
| Registro de exclusiones descargable | `FigureCard.onDownload` + enlace en `MethodDisclosure` |

---

## Átomos de apoyo

```ts
SyntaxSourceTag({ source?: SyntaxSource | null; variable?: string | null; compact?: boolean })
NationalScopeNote({ className?: string })
SectionHeading({ kicker?, title, sub? })     // ui.tsx, sin cambios
Card({ children, className? })               // ui.tsx, sin cambios
Meta({ label, value, hint? })                // ui.tsx, sin cambios
ValidationBadge({ status?, computed?, official?, diff?, unit? })   // ui.tsx, sin cambios
statusDot(status?: string): string            // ui.tsx, sin cambios
```

`SyntaxSourceTag` con `source` nulo imprime «Procedencia no declarada»: la ausencia se
nombra, no se omite.

## Campos de resultados que consumen estos componentes

- `estimate`, `ci_low`, `ci_high`, `cv`, `reliab`: valores de la fuente. El navegador no
  recalcula ninguno.
- `weighted_n` + `weighted_n_meaning`: población estimada de la categoría. `null` es
  «No disponible».
- `pop` (descarga: `weighted_denominator_n`): población estimada del universo analítico.
- `source_locator`, `evidence_level`: trazabilidad y alcance de la evidencia.
- `derived_variable`, `syntax_source`, `official_label`, `source_variables`,
  `derived_notes`: procedencia de la definición, por indicador.

No se admiten conteos muestrales como sustitutos de una N ponderada. Un número de pares,
de filas o de regiones se rotula con ese nombre y nunca como «N». Ningún filtro regional
se traslada a la consulta de la referencia nacional.

## Accesibilidad que los componentes ya garantizan

Foco visible de 3 px en todo elemento interactivo; objetivos de 44 px de alto mínimo;
conmutadores con `aria-pressed` y `aria-controls`; `role="group"` con nombre en gráficas;
`role="note"` en los estados y `role="status"` en carga; tablas con `caption`,
`scope="col"` y `aria-sort`; desplazamiento horizontal contenido en la tabla, nunca en la
página; `prefers-reduced-motion` desactiva transiciones. El color nunca es el único
portador: cada figura imprime valores, etiquetas y, en el mapa, la cifra sobre la región.
