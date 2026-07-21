"use client";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "";

export interface IndicatorValue {
  indicator_id: string;
  indicator_name: string;
  theme: string;
  subtheme: string;
  phase: string;
  country: string;
  region_code: string;
  region_name: string;
  sector_id: string;
  value: number;
  unit: string;
  standardization: string;
  polarity: string;
  source: string;
  data_quality: string;
  note?: string;
}

export interface TerritorialResponse {
  country: string;
  sector_id: string;
  total_indicators: number;
  total_regions: number;
  data_quality: string;
  by_region: Record<string, string | number>[];
  raw_values: IndicatorValue[];
  generated_at?: string;
}

export interface IndicatorCatalogEntry {
  id: string;
  name: string;
  name_en: string;
  phase: string;
  theme: string;
  subtheme: string;
  unit: string;
  methodology: string;
  source: string;
  polarity: string;
  standardization: string;
  source_variables: string[];
  notes: string;
}

export interface IndicatorCatalog {
  total_indicators: number;
  indicators: IndicatorCatalogEntry[];
}

// Static cache for pre-computed territorial JSON (build-time export)
let _cachedTerritorial: TerritorialResponse | null = null;

async function loadStaticTerritorial(): Promise<TerritorialResponse | null> {
  if (_cachedTerritorial) return _cachedTerritorial;
  try {
    const res = await fetch("/data/territorial.json");
    if (!res.ok) return null;
    _cachedTerritorial = (await res.json()) as TerritorialResponse;
    return _cachedTerritorial;
  } catch {
    return null;
  }
}

export async function fetchIndicatorCatalog(): Promise<IndicatorCatalog | null> {
  if (!ENGINE_URL) {
    // Return catalog from static territorial data
    const data = await loadStaticTerritorial();
    if (!data) return null;
    const indicators = data.raw_values
      .filter((v, i, arr) => arr.findIndex(x => x.indicator_id === v.indicator_id) === i)
      .map(v => ({
        id: v.indicator_id,
        name: v.indicator_name,
        name_en: v.indicator_name,
        phase: v.phase,
        theme: v.theme,
        subtheme: v.subtheme,
        unit: v.unit,
        methodology: "",
        source: v.source,
        polarity: v.polarity,
        standardization: v.standardization,
        source_variables: [],
        notes: v.note ?? "",
      }));
    return { total_indicators: indicators.length, indicators };
  }
  try {
    const res = await fetch(`${ENGINE_URL}/analysis/indicators/catalog`);
    if (!res.ok) return null;
    return res.json() as Promise<IndicatorCatalog>;
  } catch {
    return null;
  }
}

export async function fetchTerritorialIndicators(
  country: string,
  sectorId: string,
  regionCodes?: string[]
): Promise<TerritorialResponse | null> {
  if (!ENGINE_URL) {
    const data = await loadStaticTerritorial();
    if (!data) return null;
    if (regionCodes?.length) {
      const filtered = data.raw_values.filter(v => regionCodes.includes(v.region_code));
      const byRegion: Record<string, string | number>[] = [];
      for (const v of filtered) {
        let region = byRegion.find(r => r.region_code === v.region_code);
        if (!region) {
          region = { region_code: v.region_code, region_name: v.region_name };
          byRegion.push(region);
        }
        region[v.indicator_id] = v.value;
      }
      return {
        ...data,
        total_regions: byRegion.length,
        by_region: byRegion,
        raw_values: filtered,
      };
    }
    return data;
  }
  try {
    const body: Record<string, unknown> = { country, sector_id: sectorId };
    if (regionCodes?.length) body.region_codes = regionCodes;
    const res = await fetch(`${ENGINE_URL}/analysis/territorial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json() as Promise<TerritorialResponse>;
  } catch {
    return null;
  }
}
