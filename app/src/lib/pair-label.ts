import type { SeriesCatalogEntry } from "./types";
import { MX_STATES } from "@/data/mx-states";

/**
 * Pure, isomorphic helper (same pattern as `series-label.ts`: no `fs` import
 * anywhere in this file) that turns a raw `pair_id` like
 * "mx-chh_aeroespacial__us-tx_aeroespacial" into a human-readable label like
 * "Chihuahua (México) ↔ Texas (Estados Unidos) — Aeroespacial".
 *
 * The raw `pair_id` is an internal join key (data vintage + region + sector
 * slug), never something a casual visitor should have to parse. It should
 * still be available somewhere (title attribute / technical-detail toggle)
 * for anyone cross-referencing the raw JSON files, just never as the primary
 * on-screen text.
 */

const COUNTRY_NAMES: Record<string, string> = {
  MX: "México",
  US: "Estados Unidos",
};

function regionLabel(entry: SeriesCatalogEntry): string {
  if (entry.region_code === "NAC") return "nacional";
  if (entry.pais === "MX") {
    const state = MX_STATES.find((s) => s.code === entry.region_code);
    return state?.name ?? entry.region_code;
  }
  // No hay un catálogo de estados de EEUU en el frontend todavía; el código
  // FIPS crudo sigue siendo mejor que nada, y muy raramente es lo único que
  // se muestra (casi siempre acompaña al nombre completo de la serie).
  return entry.region_code;
}

function seriesFullLabel(entry: SeriesCatalogEntry | undefined): string {
  if (!entry) return "Serie desconocida";
  const country = COUNTRY_NAMES[entry.pais] ?? entry.pais;
  return `${country} (${regionLabel(entry)})`;
}

export function formatPairLabel(
  seriesA: SeriesCatalogEntry | undefined,
  seriesB: SeriesCatalogEntry | undefined,
  sectorLabel?: string
): string {
  const a = seriesFullLabel(seriesA);
  const b = seriesFullLabel(seriesB);
  return sectorLabel ? `${a} ↔ ${b} — ${sectorLabel}` : `${a} ↔ ${b}`;
}
