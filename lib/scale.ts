/* Escala secuencial de un tono (teal ENCODAT) para coropleta y cartograma.
   Los seis pasos y su color de texto están verificados contra WCAG AA:
   cada paso lleva el color de texto cuyo contraste es el mayor de los dos,
   y ninguno baja de 4.5:1 (mínimo observado 4.78:1 en el paso medio). */
export const SEQ_STEPS = ["#E4EFEB", "#BCD9D3", "#8DBFB7", "#4E968D", "#1F6E66", "#08433D"] as const;
/** Texto legible sobre cada paso: los cuatro claros llevan tinta, los dos oscuros blanco. */
export const SEQ_TEXT = ["#15211F", "#15211F", "#15211F", "#15211F", "#FFFFFF", "#FFFFFF"] as const;
/** Contorno visible para el paso más claro, que por sí solo no se separa del papel. */
export const SEQ_STROKE = "#6F7B73";

const LIGHT = [228, 239, 235]; // #E4EFEB
const DEEP = [8, 67, 61];      // #08433D
/** Interpolación continua, conservada por compatibilidad con llamadas previas. */
export function tealScale(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  const c = LIGHT.map((l, i) => Math.round(l + (DEEP[i] - l) * x));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
/** Índice del paso discreto (0..5) para un valor normalizado. */
export const stepIndex = (t: number) =>
  Math.min(SEQ_STEPS.length - 1, Math.max(0, Math.floor(Math.max(0, Math.min(1, t)) * SEQ_STEPS.length)));

export function makeScale(values: number[]) {
  const finite = values.filter((v) => Number.isFinite(v));
  const min = finite.length ? Math.min(...finite) : 0;
  const max = finite.length ? Math.max(...finite) : 1;
  const span = max - min || 1;
  const norm = (v: number) => (v - min) / span;
  return {
    min, max,
    steps: SEQ_STEPS as readonly string[],
    /** Clase discreta de un valor, para leyenda escalonada y para la tabla. */
    step: (v: number) => stepIndex(norm(v)),
    /** Color de relleno discreto (seis clases), no un degradado. */
    color: (v: number) => SEQ_STEPS[stepIndex(norm(v))],
    /** Color de texto legible sobre ese relleno, verificado AA. */
    text: (v: number) => SEQ_TEXT[stepIndex(norm(v))],
    /** Cortes de cada clase, para rotular la leyenda con cifras reales. */
    breaks: () => SEQ_STEPS.map((_, i) => min + (span * i) / SEQ_STEPS.length),
  };
}
/* Series categóricas: tinta / azul / naranja. Distinguibles en las tres formas
   de daltonismo más frecuentes y todas ≥4.5:1 sobre blanco, así que valen
   también como color de texto de la etiqueta de su serie. */
export const SERIES: Record<string, string> = {
  total: "#1F2A3C", hombres: "#2E4A7D", mujeres: "#9A4E11",
};
/** Color de la referencia nacional en gráficas donde compite con regiones. */
export const NATIONAL_INK = "#1F2A3C";
/** Color de la serie de datos por omisión (acento de marca). */
export const DATA_INK = "#0B5A52";
