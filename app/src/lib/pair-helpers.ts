import type { Manifest, PairMeta, SeriesCatalogEntry, ResultFile, SectorMeta } from "./types";
import type { EvidenceRow } from "@/components/charts/evidence-grid";
import type { CorridorPairData, CorridorSeriesInfo } from "@/components/charts/causality-corridor";
import { getSeries, getResult } from "./data-loader";
import { seriesShortLabel } from "./series-label";
import { grangerPlainLabel } from "./plain-language";

// Re-exported for backwards compatibility with existing imports; the
// canonical, client-safe definition now lives in `series-label.ts`.
export { seriesShortLabel };

export interface PairResultBadge {
  tone: "signal-strong" | "signal-neutral";
  label: string;
}

/**
 * Collapses a full result down to the one badge shown on a pair's *compact*
 * row (`grangerPlainLabel`-style "Sí, hay evidencia clara" / "No hay
 * evidencia suficiente"), used by `/nacional`, `/sectores/[sector]` and
 * `/estatal/[estado]` so the default view never needs the full
 * Granger/cointegration breakdown to answer "is there evidence here at all".
 * "Evidence" means any direction of Granger significance, or cointegration
 * (screening or Johansen-confirmed) — matches the criteria already used to
 * build the evidence grid and corridor.
 */
export function pairResultBadge(result: ResultFile): PairResultBadge {
  if (result.insufficient_data) {
    return { tone: "signal-neutral", label: "Datos insuficientes" };
  }
  const hasEvidence =
    result.granger.a_causes_b.significant ||
    result.granger.b_causes_a.significant ||
    Boolean(result.cointegration_engle_granger.cointegrated) ||
    (result.cointegration_johansen.cointegration_rank ?? 0) > 0;
  return { tone: hasEvidence ? "signal-strong" : "signal-neutral", label: grangerPlainLabel(hasEvidence) };
}

const MIN_STRENGTH = 0.05;

function strengthFromPValue(pValue: number | null | undefined): number {
  if (pValue === null || pValue === undefined || Number.isNaN(pValue)) return 0;
  return Math.max(MIN_STRENGTH, 1 - pValue);
}

/**
 * Builds one evidence-grid row per pair, with 3 fixed columns:
 * [MX→US, US→MX, Cointegración]. Shared by /nacional, /sectores/[sector]
 * and /estatal/[estado] so the visual encoding stays consistent everywhere
 * a pair's results are summarized.
 */
export function buildEvidenceRow(
  pair: PairMeta,
  result: ResultFile | null,
  rowLabel: string
): EvidenceRow {
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

export const EVIDENCE_COLUMNS = ["MX → EEUU", "EEUU → MX", "Cointegración"];

function shortSource(fuente: string): string {
  return fuente.split(/[-(]/)[0]?.trim() || fuente;
}

/**
 * Builds one `CorridorPairData` per pair with a result, for
 * `CausalityCorridor`. Only includes a pair when a result exists — pairs
 * without a result yet simply don't appear (no fabricated relationships).
 */
export function buildCorridorData(
  pairs: PairMeta[],
  seriesCatalog: SeriesCatalogEntry[],
  resultsByPairId: Record<string, ResultFile | null>,
  sectors: SectorMeta[] = []
): CorridorPairData[] {
  const seriesById = new Map(seriesCatalog.map((s) => [s.id, s]));
  const sectorLabelById = new Map(sectors.map((s) => [s.id, s.label]));

  const toSeriesInfo = (entry: SeriesCatalogEntry | undefined, fallbackCountry: "MX" | "US"): CorridorSeriesInfo => {
    if (!entry) return { id: "?", label: "Serie desconocida", country: fallbackCountry };
    const country: "MX" | "US" = entry.pais === "MX" ? "MX" : "US";
    const countryName = country === "MX" ? "México" : "EEUU";
    return {
      id: entry.id,
      label: entry.nombre,
      sublabel: `${countryName}, ${shortSource(entry.fuente)}`,
      fullSource: entry.fuente,
      country,
    };
  };

  const out: CorridorPairData[] = [];
  for (const pair of pairs) {
    const result = resultsByPairId[pair.pair_id];
    if (!result || result.insufficient_data) continue;

    const seriesA = seriesById.get(pair.series_a);
    const seriesB = seriesById.get(pair.series_b);

    out.push({
      id: pair.pair_id,
      rowLabel: sectorLabelById.get(pair.sector_id) ?? pair.sector_id,
      a: toSeriesInfo(seriesA, "MX"),
      b: toSeriesInfo(seriesB, "US"),
      aCausesB: {
        significant: result.granger.a_causes_b.significant,
        pValue: result.granger.a_causes_b.p_value_fdr_adj,
        fStat: result.granger.a_causes_b.f_stat,
      },
      bCausesA: {
        significant: result.granger.b_causes_a.significant,
        pValue: result.granger.b_causes_a.p_value_fdr_adj,
        fStat: result.granger.b_causes_a.f_stat,
      },
    });
  }

  return out;
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
 * dataset per sector that has at least one estatal-level pair, keyed by
 * state code, for the `/estatal` and `/estadounidense` choropleth's sector
 * selector. Iterates whatever `manifest.pairs` declares — never a hardcoded
 * sector/state list.
 */
export function buildSectorStateDatasets(manifest: Manifest, country: "MX" | "US" | "CA" = "MX"): SectorStateDataset[] {
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
      const entry = [pair.series_a, pair.series_b]
        .map((id) => seriesById.get(id))
        .find((s) => s?.pais === country);
      if (!entry || entry.region_code === "NAC") continue;

      unit = unit ?? entry.unidad;
      const value = latestObservedValue(entry.id);
      if (value !== null) valuesByState[entry.region_code] = value;

      const result = getResult(pair.pair_id);
      if (result && !result.insufficient_data) {
        const strong = Math.max(
          result.granger.a_causes_b.significant ? strengthFromPValue(result.granger.a_causes_b.p_value_fdr_adj) : 0,
          result.granger.b_causes_a.significant ? strengthFromPValue(result.granger.b_causes_a.p_value_fdr_adj) : 0
        );
        strengthByState[entry.region_code] = strong;
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
