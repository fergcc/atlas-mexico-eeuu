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
  pais: "MX" | "US" | string;
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

export interface ResultFile {
  pair_id?: string;
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
  insufficient_data?: boolean;
}
