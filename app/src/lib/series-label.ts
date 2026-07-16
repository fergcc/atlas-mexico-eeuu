import type { SeriesCatalogEntry } from "./types";

/**
 * Pure, isomorphic helper — deliberately kept in its own module (no `fs`
 * import anywhere in this file) so Client Components (e.g. the /comparativa
 * series picker) can use it without pulling `data-loader.ts` (which reads
 * from disk) into the client bundle.
 */
export function seriesShortLabel(entry?: SeriesCatalogEntry): string {
  if (!entry) return "Serie desconocida";
  return `${entry.pais} · ${entry.region_code === "NAC" ? "Nacional" : entry.region_code}`;
}
