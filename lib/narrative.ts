import type { EstimateRecord, Sex, AgeGroup } from "./types";
import { national, query } from "./data";
import { fmtVal, ci, SEX_LABEL, AGE_LABEL } from "./format";

/* ================================================================
   Texto generado a partir de los datos. Regla única: describir lo que
   la cifra dice. Nada de este módulo infiere significancia, dirección
   de un cambio ni causa, y no existe ninguna función que derive una
   conclusión del solapamiento de intervalos de confianza: el
   solapamiento no es una prueba y por eso no se expone.
   Los estados de un contraste los aporta la capa de análisis
   (ver CONTRAST_LABEL en lib/format.ts).
   ================================================================ */

/** Frase descriptiva de una observación: estimación e IC, sin adjetivos. */
export function describeEstimate(rec: EstimateRecord, unit?: string): string {
  return `${fmtVal(rec.estimate, unit)} (IC 95 % ${ci(rec.ci_low, rec.ci_high)})`;
}

/** Ordena las regiones por estimación observada. El orden es descriptivo. */
export function regionalExtremes(id: string, sex: Sex, age: AgeGroup) {
  const rows = query({ indicator_id: id, sex, age_group: age, geo_level: "region" })
    .slice().sort((a, b) => b.estimate - a.estimate);
  return { top: rows[0], bottom: rows[rows.length - 1], all: rows };
}

/**
 * Enuncia la posición observada más alta y más baja entre regiones, dejando
 * dicho que es una posición dentro del filtro y no un contraste.
 */
export function describeRegionalRange(id: string, sex: Sex, age: AgeGroup, unit?: string): string | null {
  const { top, bottom, all } = regionalExtremes(id, sex, age);
  if (!top || !bottom || all.length < 2) return null;
  return `Entre las ${all.length} regiones con estimación publicable, la más alta observada es ${top.region_name} con `
    + `${describeEstimate(top, unit)} y la más baja ${bottom.region_name} con ${describeEstimate(bottom, unit)}. `
    + `Son posiciones descriptivas dentro de este filtro y no establecen que las regiones difieran.`;
}

/**
 * Las dos observaciones nacionales por sexo, cada una con su IC. Devuelve las
 * cifras y su descripción; deliberadamente **no** devuelve un veredicto de
 * diferencia ni una prueba.
 */
export function sexContrast(id: string, age: AgeGroup, unit?: string) {
  const h = national(id, "hombres", age);
  const m = national(id, "mujeres", age);
  if (!h || !m) return null;
  return {
    h, m,
    /** Diferencia aritmética observada entre las dos estimaciones puntuales. */
    diff: h.estimate - m.estimate,
    text: `${SEX_LABEL.hombres}: ${describeEstimate(h, unit)}. ${SEX_LABEL.mujeres}: ${describeEstimate(m, unit)}. `
      + `Se describen ambas cifras y sus intervalos para ${AGE_LABEL[age]}; esta lectura no realiza un contraste entre los grupos.`,
  };
}
