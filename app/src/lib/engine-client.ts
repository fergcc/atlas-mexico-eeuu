"use client";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "";

export function hasEngine(): boolean {
  return ENGINE_URL.length > 0;
}

async function fetchEngine<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!ENGINE_URL) return null;
  try {
    const res = await fetch(`${ENGINE_URL}${path}`, init);
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export interface SectorAnalysis {
  trade?: Record<string, unknown>;
  world_bank?: Record<string, Record<string, unknown>>;
  economic_complexity?: Record<string, unknown>;
  innovation?: Record<string, unknown>;
  error?: string;
}

export interface ClassificationResult {
  analysis?: {
    overall_score?: number;
    recommended?: boolean;
    strategic_potential?: string;
    collective_efficiency?: { score: number; justification: string };
    innovation_capacity?: { score: number; justification: string };
    market_openness?: { score: number; justification: string };
    key_opportunities?: string[];
    key_risks?: string[];
  };
  error?: string;
}

export interface NarrativeResult {
  narrative?: {
    content?: string;
    model?: string;
    usage?: Record<string, number>;
  };
  error?: string;
}

export async function analyzeSector(
  sectorName: string,
  countryCodes: string[] = ["MX"]
): Promise<SectorAnalysis | null> {
  return fetchEngine<SectorAnalysis>("/analysis/sector", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sector_name: sectorName, country_codes: countryCodes, include_cgv: true }),
  });
}

export async function classifySector(
  sectorName: string,
  description: string = "",
  context: string = ""
): Promise<ClassificationResult | null> {
  return fetchEngine<ClassificationResult>("/llm/classify-sector", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sector_name: sectorName, description, context }),
  });
}

export async function generateNarrative(
  sectorId: string,
  countryCodes: string[] = ["MX"],
  language: string = "es"
): Promise<NarrativeResult | null> {
  return fetchEngine<NarrativeResult>("/llm/generate-narrative", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sector_id: sectorId, country_codes: countryCodes, language }),
  });
}

export async function checkEngineHealth(): Promise<boolean> {
  const result = await fetchEngine<{ status: string }>("/health");
  return result?.status === "ok";
}
