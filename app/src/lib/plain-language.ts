/**
 * Plain-language layer for the site's econometric vocabulary (Granger
 * causality, ADF stationarity, Engle-Granger/Johansen cointegration, VECM,
 * FDR-adjusted p-values). Pure, isomorphic string helpers — no JSX here —
 * consumed by `result-summary.tsx` and `causality-corridor.tsx`.
 *
 * Pattern: every technical term gets a plain-language label shown by
 * default; the technical name/statistic is never deleted, just moved behind
 * a `<TechnicalDetail>` toggle (see `components/ui/technical-detail.tsx`).
 * Casual visitors get an answer in one line; anyone who wants the stats
 * clicks "Ver detalle técnico".
 */

export const GRANGER_PLAIN_QUESTION = "¿Quién se mueve primero?";
export const COINTEGRATION_PLAIN_QUESTION = "¿Se mueven juntos a largo plazo?";
export const STATIONARITY_PLAIN_QUESTION = "¿La tendencia es estable o tiene dirección propia?";

export const COINTEGRATION_SCREENING_LABEL = "Primera revisión";
export const COINTEGRATION_CONFIRMATION_LABEL = "Confirmación";

/** "Significativo (p ajustada = 0.03)" -> "Sí, hay evidencia clara" */
export function grangerPlainLabel(significant: boolean): string {
  return significant ? "Sí, hay evidencia clara" : "No hay evidencia suficiente";
}

/** ADF-based stationarity badge: "I(0)/I(1)" jargon -> plain badge text. */
export function stationarityPlainLabel(isStationary: boolean | undefined): string {
  if (isStationary === undefined) return "Sin dato";
  return isStationary ? "Estable" : "Con tendencia propia";
}

/** Johansen cointegration rank -> "N relación(es) de largo plazo detectada(s)" */
export function cointegrationRankPlainLabel(rank: number | null | undefined): string {
  if (rank === null || rank === undefined) return "Sin dato de relaciones de largo plazo";
  if (rank === 0) return "Ninguna relación de largo plazo detectada";
  // "relación" -> "relaciones" in the plural (the written accent drops, it's
  // not just "relación" + "es"), so branch on the full word instead of
  // string-concatenating a suffix.
  const noun = rank === 1 ? "relación" : "relaciones";
  const verb = rank === 1 ? "detectada" : "detectadas";
  return `${rank} ${noun} de largo plazo ${verb}`;
}

/**
 * One-line plain-language reading of the VECM's error-correction speed for
 * `labelA` — the coefficient tells us how much of each period's gap versus
 * the long-run relationship with `labelB` gets closed (a negative
 * coefficient corrects back toward equilibrium; a positive one drifts away,
 * usually a small-sample artifact worth flagging rather than hiding).
 */
export function vecmAdjustmentNarrative(labelA: string, labelB: string, adjustmentSpeed: number | undefined): string | null {
  if (adjustmentSpeed === undefined || Number.isNaN(adjustmentSpeed)) return null;
  const pct = Math.round(Math.abs(adjustmentSpeed) * 100);
  if (adjustmentSpeed < 0) {
    return `Cada periodo, ${labelA} corrige ~${pct}% del desajuste respecto a su relación de largo plazo con ${labelB}.`;
  }
  return `Cada periodo, ${labelA} se aleja ~${pct}% de su relación de largo plazo con ${labelB} en vez de corregirla — señal atípica, revisar con cautela.`;
}

/**
 * One-line narrative for a causal pair, used by both the "detail" card and
 * (shortened) the "overview" ribbon in `causality-corridor.tsx`. Mirrors the
 * plan's mockup copy exactly: names the direction that IS supported by the
 * data, and is explicit when the reverse direction was tested but not found.
 */
export function causalNarrative(params: {
  aSignificant: boolean;
  bSignificant: boolean;
  labelA: string;
  labelB: string;
}): string {
  const { aSignificant, bSignificant, labelA, labelB } = params;
  if (aSignificant && bSignificant) {
    return `${labelA} y ${labelB} se anticipan mutuamente en los datos.`;
  }
  if (aSignificant) {
    return `${labelA} anticipa cambios en ${labelB}; lo inverso no se observa en los datos.`;
  }
  if (bSignificant) {
    return `${labelB} anticipa cambios en ${labelA}; lo inverso no se observa en los datos.`;
  }
  return `No se observa que ${labelA} o ${labelB} se anticipen entre sí en los datos disponibles.`;
}
