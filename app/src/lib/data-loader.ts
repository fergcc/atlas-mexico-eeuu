import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Manifest, SeriesFile, ResultFile, PairMeta, SectorMeta } from "./types";

/**
 * Server-side data access for Server Components / generateStaticParams /
 * generateMetadata. Reads directly from `public/data` (synced from the
 * monorepo's `data/` by `scripts/sync-data.mjs`) via `fs`, using
 * `process.cwd()` so it works regardless of the current working directory
 * the Next.js build is invoked from.
 *
 * Deliberately generic: every function iterates over whatever the manifest
 * declares. Nothing here hardcodes a sector, pair, or series id — the
 * pipeline can go from the 2-pair "aeroespacial" fixture to the full
 * multi-sector dataset without any change to this file.
 */

const DATA_DIR = join(process.cwd(), "public", "data");

let manifestCache: Manifest | null = null;

export function getManifest(): Manifest {
  if (manifestCache) return manifestCache;

  const manifestPath = join(DATA_DIR, "manifest.json");
  if (!existsSync(manifestPath)) {
    // Should not happen if `predev`/`prebuild` ran, but fail soft with an
    // empty-but-valid manifest so pages can render an honest "no data yet"
    // state instead of crashing the whole build.
    console.warn(
      `[data-loader] No se encontró ${manifestPath}. ¿Corriste "npm run sync-data"? Usando manifest vacío.`
    );
    return {
      generated_at: new Date(0).toISOString(),
      mode: "mock",
      refresh_cadence: "desconocida",
      sectors: [],
      series_catalog: [],
      pairs: [],
    };
  }

  manifestCache = JSON.parse(readFileSync(manifestPath, "utf-8")) as Manifest;
  return manifestCache;
}

export function getSectors(): SectorMeta[] {
  return getManifest().sectors;
}

export function getSectorById(sectorId: string): SectorMeta | undefined {
  return getSectors().find((s) => s.id === sectorId);
}

export function getPairs(): PairMeta[] {
  return getManifest().pairs;
}

export function getPairsBySector(sectorId: string): PairMeta[] {
  return getPairs().filter((p) => p.sector_id === sectorId);
}

export function getPairsByLevel(level: string): PairMeta[] {
  return getPairs().filter((p) => p.level === level);
}

export function getPairById(pairId: string): PairMeta | undefined {
  return getPairs().find((p) => p.pair_id === pairId);
}

export function getPairsByStateCode(stateCode: string): PairMeta[] {
  const manifest = getManifest();
  const seriesByRegion = new Set(
    manifest.series_catalog.filter((s) => s.region_code === stateCode).map((s) => s.id)
  );
  return manifest.pairs.filter(
    (p) => seriesByRegion.has(p.series_a) || seriesByRegion.has(p.series_b)
  );
}

export function getSeriesCatalogEntry(seriesId: string) {
  return getManifest().series_catalog.find((s) => s.id === seriesId);
}

export function getSeries(seriesId: string): SeriesFile | null {
  const seriesPath = join(DATA_DIR, "series", `${seriesId}.json`);
  if (!existsSync(seriesPath)) return null;
  try {
    return JSON.parse(readFileSync(seriesPath, "utf-8")) as SeriesFile;
  } catch {
    return null;
  }
}

export function getResult(pairId: string): ResultFile | null {
  const resultPath = join(DATA_DIR, "results", `${pairId}.json`);
  if (!existsSync(resultPath)) return null;
  try {
    return JSON.parse(readFileSync(resultPath, "utf-8")) as ResultFile;
  } catch {
    return null;
  }
}

export function listAvailableSeriesIds(): string[] {
  const seriesDir = join(DATA_DIR, "series");
  if (!existsSync(seriesDir)) return [];
  return readdirSync(seriesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function listAvailableResultIds(): string[] {
  const resultsDir = join(DATA_DIR, "results");
  if (!existsSync(resultsDir)) return [];
  return readdirSync(resultsDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

/** All distinct ISO-3166-2-like region codes ("NAC" or a 2-digit MX state code / US FIPS) referenced by the catalog. */
export function getReferencedRegionCodes(): string[] {
  const codes = new Set(getManifest().series_catalog.map((s) => s.region_code));
  return Array.from(codes);
}
