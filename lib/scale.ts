// Sequential single-hue (teal) scale — apt for a choropleth/cartogram.
const LIGHT = [227, 240, 239]; // #E3F0EF
const DEEP  = [12, 79, 83];    // #0C4F53
export function tealScale(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  const c = LIGHT.map((l, i) => Math.round(l + (DEEP[i] - l) * x));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
export function makeScale(values: number[]) {
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  return {
    min, max,
    color: (v: number) => tealScale((v - min) / span),
    text: (v: number) => ((v - min) / span > 0.52 ? "#F4FBFA" : "#0C3033"),
  };
}
// Qualitative hues (colorblind-safe: dark / blue / orange) for categorical series.
export const SERIES: Record<string, string> = {
  total: "#1A1813", hombres: "#33517E", mujeres: "#B4611F",
};
