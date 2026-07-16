import type { Manifest, PairMeta, SeriesCatalogEntry, ResultFile } from "./types";
import type { HeatmapRow } from "@/components/charts/cointegration-heatmap";
import type { GrangerGraphNode, GrangerGraphEdge } from "@/components/charts/granger-graph";
import { getSeries, getResult } from "./data-loader";
import { seriesShortLabel } from "./series-label";

// Re-exported for backwards compatibility with existing imports; the
// canonical, client-safe definition now lives in `series-label.ts`.
export { seriesShortLabel };

const MIN_STRENGTH = 0.05;

function strengthFromPValue(pValue: number | null | undefined): number {
  if (pValue === null || pValue === undefined || Number.isNaN(pValue)) return 0;
  return Math.max(MIN_STRENGTH, 1 - pValue);
}

/**
 * Builds one heatmap row per pair, with 3 fixed columns:
 * [MX→US, US→MX, Cointegración]. Shared by /nacional, /sectores/[sector]
 * and /estatal/[estado] so the visual encoding stays consistent everywhere
 * a pair's results are summarized.
 */
export function buildHeatmapRow(
  pair: PairMeta,
  result: ResultFile | null,
  rowLabel: string
): HeatmapRow {
  if (!result || result.insufficient_data) {
    return {
      id: pair.pair_id,
      label: rowLabel,
      cells: [
        { key: `${pair.pair_id}-ab`, strength: 0, significant: false, pValue: null, insufficientData: true },
        { key: `${pair.pair_id}-ba`, strength: 0, significant: false, pValue: null, insufficientData: true },
        { key: `${pair.pair_id}-coint`, strength: 0, significant: false, pValue: null, insufficientData: true },
      ],
    };
  }

  const coint = result.cointegration_engle_granger;

  return {
    id: pair.pair_id,
    label: rowLabel,
    cells: [
      {
        key: `${pair.pair_id}-ab`,
        strength: strengthFromPValue(result.granger.a_causes_b.p_value_fdr_adj),
        significant: result.granger.a_causes_b.significant,
        pValue: result.granger.a_causes_b.p_value_fdr_adj,
      },
      {
        key: `${pair.pair_id}-ba`,
        strength: strengthFromPValue(result.granger.b_causes_a.p_value_fdr_adj),
        significant: result.granger.b_causes_a.significant,
        pValue: result.granger.b_causes_a.p_value_fdr_adj,
      },
      {
        key: `${pair.pair_id}-coint`,
        strength: strengthFromPValue(coint.p_value),
        significant: Boolean(coint.cointegrated),
        pValue: coint.p_value ?? null,
      },
    ],
  };
}

export const HEATMAP_COLUMNS = ["MX → EEUU", "EEUU → MX", "Cointegración"];

/**
 * Aggregates several pairs into a deduplicated node/edge set for
 * `GrangerGraph`. Only draws an edge when a result exists for that pair —
 * pairs without a result yet simply don't appear (no fabricated edges).
 */
export function buildGrangerGraphData(
  pairs: PairMeta[],
  seriesCatalog: SeriesCatalogEntry[],
  resultsByPairId: Record<string, ResultFile | null>
): { nodes: GrangerGraphNode[]; edges: GrangerGraphEdge[] } {
  const seriesById = new Map(seriesCatalog.map((s) => [s.id, s]));
  const nodesById = new Map<string, GrangerGraphNode>();
  const edges: GrangerGraphEdge[] = [];

  for (const pair of pairs) {
    const result = resultsByPairId[pair.pair_id];
    if (!result || result.insufficient_data) continue;

    const a = seriesById.get(pair.series_a);
    const b = seriesById.get(pair.series_b);

    if (a && !nodesById.has(a.id)) {
      nodesById.set(a.id, { id: a.id, label: a.nombre, country: "MX", sublabel: a.unidad });
    }
    if (b && !nodesById.has(b.id)) {
      nodesById.set(b.id, { id: b.id, label: b.nombre, country: "US", sublabel: b.unidad });
    }

    edges.push({
      id: `${pair.pair_id}-ab`,
      source: pair.series_a,
      target: pair.series_b,
      pValue: result.granger.a_causes_b.p_value_fdr_adj,
      significant: result.granger.a_causes_b.significant,
    });
    edges.push({
      id: `${pair.pair_id}-ba`,
      source: pair.series_b,
      target: pair.series_a,
      pValue: result.granger.b_causes_a.p_value_fdr_adj,
      significant: result.granger.b_causes_a.significant,
    });
  }

  return { nodes: Array.from(nodesById.values()), edges };
}

export interface SectorStateDataset {
  sectorId: string;
  label: string;
  unit?: string;
  valuesByState: Record<string, number>;
  strengthByState: Record<string, number>;
}

function latestObservedValue(seriesId: string): number | null {
  const series = getSeries(seriesId);
  if (!series) return null;
  for (let i = series.observations.length - 1; i >= 0; i--) {
    const v = series.observations[i].value;
    if (v !== null && v !== undefined && !Number.isNaN(v)) return v;
  }
  return null;
}

/**
 * Server-only (reads `data/series` + `data/results` via fs). Builds one
 * dataset per sector that has at least one estatal-level pair, keyed by MX
 * state code, for the `/estatal` choropleth's sector selector. Iterates
 * whatever `manifest.pairs` declares — never a hardcoded sector/state list.
 */
export function buildSectorStateDatasets(manifest: Manifest): SectorStateDataset[] {
  const estatalPairs = manifest.pairs.filter((p) => p.level === "estatal");
  const seriesById = new Map(manifest.series_catalog.map((s) => [s.id, s]));
  const bySector = new Map<string, PairMeta[]>();

  for (const pair of estatalPairs) {
    const list = bySector.get(pair.sector_id) ?? [];
    list.push(pair);
    bySector.set(pair.sector_id, list);
  }

  const sectorLabel = new Map(manifest.sectors.map((s) => [s.id, s.label]));

  return Array.from(bySector.entries()).map(([sectorId, pairsForSector]) => {
    const valuesByState: Record<string, number> = {};
    const strengthByState: Record<string, number> = {};
    let unit: string | undefined;

    for (const pair of pairsForSector) {
      const mxEntry = [pair.series_a, pair.series_b]
        .map((id) => seriesById.get(id))
        .find((s) => s?.pais === "MX");
      if (!mxEntry || mxEntry.region_code === "NAC") continue;

      unit = unit ?? mxEntry.unidad;
      const value = latestObservedValue(mxEntry.id);
      if (value !== null) valuesByState[mxEntry.region_code] = value;

      const result = getResult(pair.pair_id);
      if (result && !result.insufficient_data) {
        const strong = Math.max(
          result.granger.a_causes_b.significant ? strengthFromPValue(result.granger.a_causes_b.p_value_fdr_adj) : 0,
          result.granger.b_causes_a.significant ? strengthFromPValue(result.granger.b_causes_a.p_value_fdr_adj) : 0
        );
        strengthByState[mxEntry.region_code] = strong;
      }
    }

    return {
      sectorId,
      label: sectorLabel.get(sectorId) ?? sectorId,
      unit,
      valuesByState,
      strengthByState,
    };
  });
}
