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
}

export interface TerritorialResponse {
  country: string;
  sector_id: string;
  total_indicators: number;
  total_regions: number;
  data_quality: string;
  by_region: Record<string, number>[];
  raw_values: IndicatorValue[];
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

export async function fetchIndicatorCatalog(): Promise<IndicatorCatalog | null> {
  if (!ENGINE_URL) return null;
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
  if (!ENGINE_URL) return null;
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
