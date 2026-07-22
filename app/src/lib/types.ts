/**
 * Tipos compartidos que reflejan el esquema de `data/manifest.json`,
 * `data/series/{id}.json` y `data/results/{pair_id}.json` producidos por el
 * pipeline Python (ver pipeline/export/to_json.py). Mantener en sync con ese
 * esquema — nunca asumir campos que el pipeline no documenta.
 */

export type ProxyType = "output_index" | "labor_input" | string;

export interface SectorMeta {
  id: string;
  label: string;
  icon: string;
  priority: "strategic" | "reference" | string;
}

export interface SeriesCatalogEntry {
  id: string;
  nombre: string;
  pais: Country | string;
  region_code: string;
  sector_id: string;
  fuente: string;
  periodicidad: string;
  unidad: string;
  proxy_type: ProxyType;
  ultima_actualizacion: string;
  proxima_actualizacion_estimada: string;
}

export type PairLevel = "nacional" | "estatal" | "regional" | string;

export interface PairMeta {
  pair_id: string;
  level: PairLevel;
  sector_id: string;
  series_a: string;
  series_b: string;
}

export interface Manifest {
  generated_at: string;
  mode: "mock" | "live" | string;
  refresh_cadence: string;
  sectors: SectorMeta[];
  series_catalog: SeriesCatalogEntry[];
  pairs: PairMeta[];
}

export interface SeriesObservation {
  period: string;
  value: number | null;
}

export interface SeriesFile {
  id: string;
  meta: Partial<SeriesCatalogEntry> & Record<string, unknown>;
  observations: SeriesObservation[];
}

export interface StationarityResult {
  adf_statistic?: number;
  adf_p_value?: number;
  kpss_statistic?: number;
  kpss_p_value?: number;
  is_stationary?: boolean;
  order_of_integration?: number;
  [key: string]: unknown;
}

export interface GrangerDirectionResult {
  f_stat: number;
  p_value: number;
  p_value_fdr_adj: number;
  significant: boolean;
  [key: string]: unknown;
}

export interface GrangerResult {
  a_causes_b: GrangerDirectionResult;
  b_causes_a: GrangerDirectionResult;
  optimal_lag?: number;
  selection_criterion?: string;
}

export interface CointegrationEngleGranger {
  statistic?: number;
  p_value?: number;
  cointegrated?: boolean;
  [key: string]: unknown;
}

export interface CointegrationJohansen {
  trace_statistic?: number[];
  critical_values?: number[][];
  cointegration_rank?: number;
  [key: string]: unknown;
}

export interface VecmResult {
  cointegration_vector?: number[];
  adjustment_speed?: number[];
  [key: string]: unknown;
}

export type Country = "MX" | "US" | "CA";

/** One row of `data/territorial.json` — a single indicator's value for a single region. */
export interface TerritorialIndicatorValue {
  indicator_id: string;
  indicator_name: string;
  theme: string;
  subtheme: string;
  phase: string;
  country: Country;
  region_code: string;
  region_name: string;
  value: number;
  unit: string;
  source: string;
  data_quality: string;
  note?: string;
}

export interface TerritorialFile {
  generated_at: string;
  country: Country;
  total_indicators: number;
  total_regions: number;
  data_quality: string;
  raw_values: TerritorialIndicatorValue[];
}

export interface ResultSeriesMeta {
  id: string;
  source: string;
  region: string;
  proxy_type: string;
  seasonal_adjustment?: string;
}

export interface ResultSectorMeta {
  id: string;
  scian?: string;
  naics?: string;
  label?: string;
}

export interface ResultFile {
  pair_id?: string;
  sector?: ResultSectorMeta;
  series_a?: ResultSeriesMeta;
  series_b?: ResultSeriesMeta;
  sample: {
    n_obs: number;
    [key: string]: unknown;
  };
  stationarity: {
    a: StationarityResult;
    b: StationarityResult;
  };
  granger: GrangerResult;
  cointegration_engle_granger: CointegrationEngleGranger;
  cointegration_johansen: CointegrationJohansen;
  vecm: VecmResult | null;
  warnings: string[];
  generated_at: string;
  data_vintage: string;
  data_vintage_detail?: { a: string; b: string };
  insufficient_data?: boolean;
}
