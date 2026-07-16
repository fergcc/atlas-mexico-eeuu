import type { SeriesCatalogEntry } from "./types";

/**
 * Locale-aware formatting helpers. Always go through `Intl.*` — never
 * hand-roll a date/number format — so behavior stays correct regardless of
 * where the app is deployed or who clones it.
 */

const LOCALE = "es-MX";

export function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "s/d";
  return new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatPValue(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "s/d";
  if (value < 0.001) return "< 0.001";
  return new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: 3,
    minimumFractionDigits: 3,
  }).format(value);
}

export function formatDateLong(iso: string | null | undefined): string {
  if (!iso) return "s/d";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "s/d";
  return new Intl.DateTimeFormat(LOCALE, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "s/d";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "s/d";
  return new Intl.DateTimeFormat(LOCALE, {
    year: "numeric",
    month: "short",
  }).format(date);
}

/**
 * Series `period` values follow "YYYY", "YYYY-MM", or "YYYY-Qn". Render a
 * short human label for chart axes/tooltips without assuming which shape
 * a given series uses.
 */
export function formatPeriodLabel(period: string): string {
  const quarterMatch = period.match(/^(\d{4})-Q([1-4])$/i);
  if (quarterMatch) return `T${quarterMatch[2]} ${quarterMatch[1]}`;

  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const date = new Date(Number(monthMatch[1]), Number(monthMatch[2]) - 1, 1);
    return new Intl.DateTimeFormat(LOCALE, { year: "numeric", month: "short" }).format(date);
  }

  const yearMatch = period.match(/^\d{4}$/);
  if (yearMatch) return period;

  return period;
}

export type FreshnessTone = "fresh" | "stable" | "annual" | "stale";

export interface FreshnessInfo {
  label: string;
  detail: string;
  tone: FreshnessTone;
}

type PeriodicityKind = "diaria" | "mensual" | "trimestral" | "anual" | "otra";

function classifyPeriodicity(periodicidad: string): PeriodicityKind {
  const p = periodicidad.toLowerCase();
  if (p.includes("diari")) return "diaria";
  if (p.includes("mensual")) return "mensual";
  if (p.includes("trimestral")) return "trimestral";
  if (p.includes("anual")) return "anual";
  return "otra";
}

/**
 * Declares the *real* freshness of an indicator instead of a generic
 * "actualizado hace N días" that implies weekly novelty nothing in this
 * dataset actually has (see plan: no source publishes weekly except FIX).
 */
export function getFreshnessInfo(
  entry: Pick<SeriesCatalogEntry, "periodicidad" | "ultima_actualizacion" | "proxima_actualizacion_estimada">,
  referenceIso?: string
): FreshnessInfo {
  const kind = classifyPeriodicity(entry.periodicidad);
  const referenceDate = referenceIso ? new Date(referenceIso) : new Date();
  const lastUpdate = new Date(entry.ultima_actualizacion);
  const nextUpdate = formatDateLong(entry.proxima_actualizacion_estimada);

  const validRef = !Number.isNaN(referenceDate.getTime()) && !Number.isNaN(lastUpdate.getTime());
  const daysSince = validRef
    ? Math.floor((referenceDate.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;

  if (kind === "anual") {
    return {
      label: "Dato anual",
      detail: `Última cifra: ${formatDateLong(entry.ultima_actualizacion)}. Próxima estimada: ${nextUpdate}.`,
      tone: "annual",
    };
  }

  if (daysSince <= 7) {
    return {
      label: "Actualizado esta semana",
      detail: `Publicado ${formatDateLong(entry.ultima_actualizacion)} (periodicidad ${entry.periodicidad}). Próxima estimada: ${nextUpdate}.`,
      tone: "fresh",
    };
  }

  if (daysSince > 400) {
    return {
      label: "Dato desactualizado",
      detail: `Última cifra disponible: ${formatDateLong(entry.ultima_actualizacion)} (periodicidad ${entry.periodicidad}).`,
      tone: "stale",
    };
  }

  return {
    label: `Sin cambios, periodicidad ${kind === "otra" ? entry.periodicidad : kind}`,
    detail: `Última cifra: ${formatDateLong(entry.ultima_actualizacion)}. Próxima estimada: ${nextUpdate}.`,
    tone: "stable",
  };
}

export function significanceLabel(pValueAdj: number, significant: boolean): string {
  if (significant) return `Significativo (p ajustada = ${formatPValue(pValueAdj)})`;
  return `No significativo (p ajustada = ${formatPValue(pValueAdj)})`;
}
